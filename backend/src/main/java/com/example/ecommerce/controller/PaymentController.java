package com.example.ecommerce.controller;

import com.example.ecommerce.dto.AbaCheckoutRequest;
import com.example.ecommerce.dto.KhqrResponse;
import com.example.ecommerce.dto.PayWayCheckoutResponse;
import com.example.ecommerce.dto.PaymentRequest;
import com.example.ecommerce.dto.PaymentResponse;
import com.example.ecommerce.dto.PaymentStatusRequest;
import com.example.ecommerce.service.PayWayService;
import com.example.ecommerce.service.PaymentService;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;
    private final PayWayService payWayService;
    private final ObjectMapper objectMapper;

    /** Pay for one of the logged-in user's PENDING orders (simulated gateway). */
    @PostMapping
    public ResponseEntity<PaymentResponse> pay(@Valid @RequestBody PaymentRequest request,
                                               Authentication authentication) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(paymentService.pay(authentication.getName(), request));
    }

    /** Payments of one of the logged-in user's orders. */
    @GetMapping("/order/{orderId}")
    public List<PaymentResponse> getForOrder(@PathVariable Long orderId, Authentication authentication) {
        return paymentService.getPaymentsForMyOrder(orderId, authentication.getName());
    }

    /** Admin: all payments. */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<PaymentResponse> getAll() {
        return paymentService.getAll();
    }

    /** Admin: change payment status. */
    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public PaymentResponse updateStatus(@PathVariable Long id, @Valid @RequestBody PaymentStatusRequest request) {
        return paymentService.updateStatus(id, request.status());
    }

    // ---------------- ABA PayWay ----------------

    /** Lets the frontend hide the ABA PayWay option while the server has no PayWay credentials. */
    @GetMapping("/aba/status")
    public Map<String, Boolean> abaStatus() {
        return Map.of("enabled", payWayService.isConfigured());
    }

    /** Step 1: returns the signed form fields. The browser POSTs them to PayWay's hosted checkout page. */
    @PostMapping("/aba/checkout")
    public PayWayCheckoutResponse abaCheckout(@Valid @RequestBody AbaCheckoutRequest request,
                                              Authentication authentication) {
        return payWayService.createCheckout(authentication.getName(), request.orderId());
    }

    /** KHQR: returns a real QR code (image) for the customer to scan with ABA Mobile or any KHQR bank app. */
    @PostMapping("/aba/khqr")
    public KhqrResponse abaKhqr(@Valid @RequestBody AbaCheckoutRequest request, Authentication authentication) {
        return payWayService.createKhqr(authentication.getName(), request.orderId());
    }

    /** Step 2: after the customer returns from PayWay. Asks PayWay for the real result. */
    @PostMapping("/aba/confirm")
    public PaymentResponse abaConfirm(@Valid @RequestBody AbaCheckoutRequest request,
                                      Authentication authentication) {
        return payWayService.confirmForOrder(authentication.getName(), request.orderId());
    }


    @PostMapping("/aba/callback")
    public Map<String, String> abaCallback(HttpServletRequest request) {
        String tranId = request.getParameter("tran_id"); // form-encoded body
        if (tranId == null) {
            try {
                tranId = objectMapper.readTree(request.getInputStream()).path("tran_id").asText(null); // JSON body
            } catch (IOException ignored) {
                // not JSON: nothing to read
            }
        }
        if (tranId != null && tranId.matches("[A-Za-z0-9-]{1,40}")) {
            payWayService.handleCallback(tranId);
        }
        return Map.of("status", "ok");
    }
}