package com.example.ecommerce.service;

import com.example.ecommerce.dto.KhqrResponse;
import com.example.ecommerce.dto.PayWayCheckoutResponse;
import com.example.ecommerce.dto.PaymentResponse;
import com.example.ecommerce.exception.BadRequestException;
import com.example.ecommerce.exception.ResourceNotFoundException;
import com.example.ecommerce.model.Order;
import com.example.ecommerce.model.OrderStatus;
import com.example.ecommerce.model.Payment;
import com.example.ecommerce.model.PaymentMethod;
import com.example.ecommerce.model.PaymentStatus;
import com.example.ecommerce.repository.OrderRepository;
import com.example.ecommerce.repository.PaymentRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@Transactional(readOnly = true)
public class PayWayService {

    private static final String PURCHASE_PATH = "/api/payment-gateway/v1/payments/purchase";
    private static final String CHECK_PATH = "/api/payment-gateway/v1/payments/check-transaction-2";
    private static final DateTimeFormatter REQ_TIME = DateTimeFormatter.ofPattern("yyyyMMddHHmmss").withZone(ZoneOffset.UTC);
    private static final String QR_PATH = "/api/payment-gateway/v1/payments/generate-qr";
    private static final String CURRENCY = "USD";
    private static final String PURCHASE_TYPE = "purchase";
    private static final String PAYMENT_OPTION_KHQR = "abapay_khqr";
    private static final String QR_TEMPLATE = "template3_color";
    private static final int KHQR_LIFETIME_MINUTES = 10; // PayWay minimum is 3
    private static final int MAX_ATTEMPTS_CHECKED = 3;

    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;
    private final ObjectMapper objectMapper;
    private final RestClient http = RestClient.create();

    private final String merchantId;
    private final String apiKey;
    private final String baseUrl;
    private final String returnUrl;
    private final String frontendUrl;

    public PayWayService(OrderRepository orderRepository,
                         PaymentRepository paymentRepository,
                         ObjectMapper objectMapper,
                         @Value("${payway.merchant-id:}") String merchantId,
                         @Value("${payway.api-key:}") String apiKey,
                         @Value("${payway.base-url:https://checkout-sandbox.payway.com.kh}") String baseUrl,
                         @Value("${payway.return-url:}") String returnUrl,
                         @Value("${payway.frontend-url:http://localhost:3000}") String frontendUrl) {
        this.orderRepository = orderRepository;
        this.paymentRepository = paymentRepository;
        this.objectMapper = objectMapper;
        this.merchantId = merchantId.trim();
        this.apiKey = apiKey.trim();
        this.baseUrl = stripTrailingSlash(baseUrl.trim());
        this.returnUrl = returnUrl.trim();
        this.frontendUrl = stripTrailingSlash(frontendUrl.trim());
    }

    public boolean isConfigured() {
        return !merchantId.isEmpty() && !apiKey.isEmpty();
    }

    // ---------------- start a payment ----------------

    // noRollbackFor: when an earlier attempt turns out to be paid we throw "already paid", and that
    // discovery (payment COMPLETED, order PAID) must still be saved.
    @Transactional(noRollbackFor = BadRequestException.class)
    public PayWayCheckoutResponse createCheckout(String username, Long orderId) {
        Payment payment = newAttempt(username, orderId);
        Order order = payment.getOrder();
        String tranId = payment.getTransactionRef();

        String amount = order.getTotalPrice().setScale(2, RoundingMode.HALF_UP).toPlainString();
        String reqTime = REQ_TIME.format(Instant.now());
        String items = itemsBase64(order);
        String returnUrlEncoded = returnUrl.isEmpty() ? "" : base64(returnUrl); // PayWay wants return_url Base64-encoded
        String cancelUrl = frontendUrl + "/orders?aba=cancel&order=" + order.getId();
        String continueUrl = frontendUrl + "/orders?aba=" + order.getId();

        // The hash covers these values in PayWay's fixed order. Fields we do not use are empty and add nothing.
        // Order: req_time, merchant_id, tran_id, amount, items, ..., return_url, cancel_url,
        //        continue_success_url, ..., currency
        String hash = sign(reqTime + merchantId + tranId + amount + items
                + returnUrlEncoded + cancelUrl + continueUrl + CURRENCY);

        Map<String, String> fields = new LinkedHashMap<>();
        fields.put("req_time", reqTime);
        fields.put("merchant_id", merchantId);
        fields.put("tran_id", tranId);
        fields.put("amount", amount);
        fields.put("items", items);
        if (!returnUrlEncoded.isEmpty()) {
            fields.put("return_url", returnUrlEncoded);
        }
        fields.put("cancel_url", cancelUrl);
        fields.put("continue_success_url", continueUrl);
        fields.put("currency", CURRENCY);
        fields.put("hash", hash);

        return new PayWayCheckoutResponse(baseUrl + PURCHASE_PATH, fields);
    }

    /** Checks that the order can be paid, then records a new PENDING ABA attempt with a fresh tran_id. */
    private Payment newAttempt(String username, Long orderId) {
        requireConfigured();
        Order order = findOwnedOrder(orderId, username);
        if (order.getStatus() != OrderStatus.PENDING) {
            throw new BadRequestException("Order cannot be paid (status: " + order.getStatus() + ")");
        }

        List<Payment> existing = paymentRepository.findByOrderId(order.getId());
        for (Payment payment : existing) {
            if (payment.getStatus() == PaymentStatus.COMPLETED) {
                throw new BadRequestException("This order is already paid");
            }
            if (payment.getStatus() == PaymentStatus.PENDING && payment.getMethod() != PaymentMethod.ABA_PAYWAY) {
                throw new BadRequestException("This order already has a payment");
            }
        }

        // An earlier attempt may already have been paid even though the customer never came back.
        verifyAttempts(abaPayments(existing));
        if (order.getStatus() != OrderStatus.PENDING) {
            throw new BadRequestException("This order was already paid");
        }
        // Older unfinished attempts are replaced by the new one
        abaPayments(existing).stream()
                .filter(p -> p.getStatus() == PaymentStatus.PENDING)
                .forEach(p -> p.setStatus(PaymentStatus.FAILED));

        // tran_id: unique for every attempt, max 20 characters (PayWay rule)
        String tranId = "O" + order.getId() + "-" + (System.currentTimeMillis() / 1000);
        return paymentRepository.save(Payment.builder()
                .order(order)
                .amount(order.getTotalPrice())
                .method(PaymentMethod.ABA_PAYWAY)
                .transactionRef(tranId)
                .build());
    }

    // ---------------- KHQR (scan to pay) ----------------

    /**
     * Asks ABA PayWay for a real KHQR code for this order. The browser shows it in a modal and keeps asking
     * confirmForOrder() until the customer has paid. Requires the QR API to be enabled for the merchant.
     */
    @Transactional(noRollbackFor = BadRequestException.class)
    public KhqrResponse createKhqr(String username, Long orderId) {
        Payment payment = newAttempt(username, orderId);
        Order order = payment.getOrder();
        String tranId = payment.getTransactionRef();

        // Canonical amount text ("39", "19.5", "12.99"): the same text is signed and sent as a JSON number
        String amount = order.getTotalPrice().stripTrailingZeros().toPlainString();
        String reqTime = REQ_TIME.format(Instant.now());
        String items = itemsBase64(order);
        String callbackUrl = returnUrl.isEmpty() ? "" : base64(returnUrl);

        // Hash order (unused fields are empty): req_time, merchant_id, tran_id, amount, items, first_name,
        // last_name, email, phone, purchase_type, payment_option, callback_url, return_deeplink, currency,
        // custom_fields, return_params, payout, lifetime, qr_image_template
        String hash = sign(reqTime + merchantId + tranId + amount + items
                + PURCHASE_TYPE + PAYMENT_OPTION_KHQR + callbackUrl
                + CURRENCY + KHQR_LIFETIME_MINUTES + QR_TEMPLATE);

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("req_time", reqTime);
        body.put("merchant_id", merchantId);
        body.put("tran_id", tranId);
        body.put("amount", new BigDecimal(amount));
        body.put("items", items);
        body.put("purchase_type", PURCHASE_TYPE);
        body.put("payment_option", PAYMENT_OPTION_KHQR);
        if (!callbackUrl.isEmpty()) {
            body.put("callback_url", callbackUrl);
        }
        body.put("currency", CURRENCY);
        body.put("lifetime", KHQR_LIFETIME_MINUTES);
        body.put("qr_image_template", QR_TEMPLATE);
        body.put("hash", hash);

        JsonNode root;
        try {
            root = http.post()
                    .uri(baseUrl + QR_PATH)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(JsonNode.class);
        } catch (RestClientException ex) {
            log.error("ABA PayWay generate-qr failed for {}: {}", tranId, ex.getMessage());
            payment.setStatus(PaymentStatus.FAILED);
            throw new BadRequestException("Could not reach ABA PayWay to create the QR code. Please try again.");
        }

        String code = root == null ? "" : root.path("status").path("code").asText("");
        String qrImage = root == null ? "" : root.path("qrImage").asText("");
        if ((!code.equals("0") && !code.equals("00")) || qrImage.isEmpty()) {
            String message = root == null ? "" : root.path("status").path("message").asText("");
            log.error("ABA PayWay generate-qr refused {}: code={} message={}", tranId, code, message);
            payment.setStatus(PaymentStatus.FAILED);
            throw new BadRequestException(qrErrorMessage(code, message));
        }

        return new KhqrResponse(
                qrImage,
                root.path("qrString").asText(""),
                root.path("abapay_deeplink").asText(""),
                order.getTotalPrice(),
                CURRENCY,
                tranId,
                KHQR_LIFETIME_MINUTES);
    }

    private String qrErrorMessage(String code, String message) {
        return switch (code) {
            case "1" -> "ABA PayWay rejected the signature (wrong hash). Check PAYWAY_MERCHANT_ID and PAYWAY_API_KEY.";
            case "6", "102" -> "This website address is not whitelisted by ABA PayWay.";
            case "23", "32" -> "KHQR is not enabled for this ABA PayWay merchant account.";
            case "403" -> "Duplicate transaction. Please try again.";
            default -> "ABA PayWay could not create the QR code (code " + (code.isEmpty() ? "none" : code) + ")"
                    + (message.isBlank() ? "." : ": " + message);
        };
    }

    // ---------------- confirm a payment (always asks PayWay) ----------------

    /** Called when the customer comes back from PayWay, or presses "Check payment". */
    @Transactional
    public PaymentResponse confirmForOrder(String username, Long orderId) {
        requireConfigured();
        Order order = findOwnedOrder(orderId, username);
        List<Payment> attempts = abaPayments(paymentRepository.findByOrderId(order.getId()));
        if (attempts.isEmpty()) {
            throw new BadRequestException("No ABA PayWay payment was started for this order");
        }
        verifyAttempts(attempts);
        Payment result = attempts.stream()
                .filter(p -> p.getStatus() == PaymentStatus.COMPLETED)
                .findFirst()
                .orElse(attempts.get(0));
        return PaymentResponse.from(result);
    }

    /** Called by PayWay's server. The body is not trusted: only the tran_id is used, then PayWay is asked. */
    @Transactional
    public void handleCallback(String tranId) {
        if (!isConfigured() || tranId == null) {
            return;
        }
        paymentRepository.findByTransactionRef(tranId)
                .filter(p -> p.getMethod() == PaymentMethod.ABA_PAYWAY && p.getStatus() != PaymentStatus.COMPLETED)
                .ifPresent(this::verify);
    }

    // ---------------- used when an order is cancelled ----------------

    @Transactional
    public void refreshPendingAbaPayments(Long orderId) {
        if (!isConfigured()) {
            return;
        }
        List<Payment> pending = abaPayments(paymentRepository.findByOrderId(orderId)).stream()
                .filter(p -> p.getStatus() == PaymentStatus.PENDING)
                .toList();
        verifyAttempts(pending);
    }

    @Transactional
    public void markPendingAbaPaymentsFailed(Long orderId) {
        abaPayments(paymentRepository.findByOrderId(orderId)).stream()
                .filter(p -> p.getStatus() == PaymentStatus.PENDING)
                .forEach(p -> p.setStatus(PaymentStatus.FAILED));
    }

    // ---------------- helpers ----------------

    private void verifyAttempts(List<Payment> attempts) {
        int checked = 0;
        for (Payment payment : attempts) { // newest first
            if (payment.getStatus() == PaymentStatus.COMPLETED) {
                return;
            }
            if (checked++ >= MAX_ATTEMPTS_CHECKED) {
                return;
            }
            verify(payment);
            if (payment.getStatus() == PaymentStatus.COMPLETED) {
                return;
            }
        }
    }

    /** Ask PayWay what really happened to this tran_id, then update our records. */
    private void verify(Payment payment) {
        JsonNode root = callCheckTransaction(payment.getTransactionRef());
        String code = root == null ? "" : root.path("status").path("code").asText("");
        if (!code.equals("00") && !code.equals("0")) {
            return; // e.g. 6 = transaction not found (the customer never opened the PayWay page)
        }

        JsonNode data = root.path("data");
        switch (data.path("payment_status_code").asInt(-1)) {
            case 0 -> complete(payment, data);                  // APPROVED
            case 3, 7 -> {                                      // DECLINED, CANCELLED
                if (payment.getStatus() == PaymentStatus.PENDING) {
                    payment.setStatus(PaymentStatus.FAILED);
                }
            }
            default -> { /* 2 = still pending: nothing to change yet */ }
        }
    }

    private void complete(Payment payment, JsonNode data) {
        BigDecimal paid = data.path("original_amount").decimalValue();
        if (paid.compareTo(payment.getAmount()) != 0) {
            log.error("ABA PayWay amount mismatch for {}: PayWay says {}, order expects {}",
                    payment.getTransactionRef(), paid, payment.getAmount());
            return; // never mark a payment as paid when the amount is wrong
        }
        if (payment.getStatus() == PaymentStatus.COMPLETED) {
            return;
        }
        payment.setStatus(PaymentStatus.COMPLETED);
        payment.setPaidAt(LocalDateTime.now());

        Order order = payment.getOrder();
        if (order.getStatus() == OrderStatus.PENDING) {
            order.setStatus(OrderStatus.PAID);
        } else {
            log.warn("ABA PayWay payment {} was received but order {} is {}: this needs a manual refund or review",
                    payment.getTransactionRef(), order.getId(), order.getStatus());
        }
    }

    private JsonNode callCheckTransaction(String tranId) {
        String reqTime = REQ_TIME.format(Instant.now());
        Map<String, String> body = Map.of(
                "req_time", reqTime,
                "merchant_id", merchantId,
                "tran_id", tranId,
                "hash", sign(reqTime + merchantId + tranId));
        try {
            return http.post()
                    .uri(baseUrl + CHECK_PATH)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(JsonNode.class);
        } catch (RestClientException ex) {
            log.error("ABA PayWay check-transaction failed for {}: {}", tranId, ex.getMessage());
            throw new BadRequestException("Could not verify the payment with ABA PayWay. Please try again in a moment.");
        }
    }

    private List<Payment> abaPayments(List<Payment> payments) {
        return payments.stream()
                .filter(p -> p.getMethod() == PaymentMethod.ABA_PAYWAY)
                .sorted(Comparator.comparing(Payment::getId).reversed())
                .toList();
    }

    private Order findOwnedOrder(Long orderId, String username) {
        return orderRepository.findById(orderId)
                .filter(o -> o.getUser().getUsername().equals(username))
                .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + orderId));
    }

    private void requireConfigured() {
        if (!isConfigured()) {
            throw new BadRequestException("ABA PayWay is not configured on the server yet");
        }
    }

    // The items are only a description shown on the PayWay page (PayWay ignores their price for validation).
    private String itemsBase64(Order order) {
        try {
            List<Map<String, Object>> items = order.getItems().stream()
                    .map(item -> Map.<String, Object>of(
                            "name", item.getProduct().getName(),
                            "quantity", item.getQuantity(),
                            "price", item.getPrice()))
                    .toList();
            String encoded = base64(objectMapper.writeValueAsString(items));
            if (encoded.length() <= 500) { // PayWay limit
                return encoded;
            }
            return base64(objectMapper.writeValueAsString(List.of(Map.<String, Object>of(
                    "name", "Order #" + order.getId(), "quantity", 1, "price", order.getTotalPrice()))));
        } catch (JsonProcessingException ex) {
            throw new IllegalStateException("Could not build the item list", ex);
        }
    }

    // Base64( HMAC-SHA512(data, apiKey) ), as required by every PayWay API
    private String sign(String data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA512");
            mac.init(new SecretKeySpec(apiKey.getBytes(StandardCharsets.UTF_8), "HmacSHA512"));
            return Base64.getEncoder().encodeToString(mac.doFinal(data.getBytes(StandardCharsets.UTF_8)));
        } catch (GeneralSecurityException ex) {
            throw new IllegalStateException("Could not sign the PayWay request", ex);
        }
    }

    private static String base64(String text) {
        return Base64.getEncoder().encodeToString(text.getBytes(StandardCharsets.UTF_8));
    }

    private static String stripTrailingSlash(String url) {
        return url.endsWith("/") ? url.substring(0, url.length() - 1) : url;
    }
}