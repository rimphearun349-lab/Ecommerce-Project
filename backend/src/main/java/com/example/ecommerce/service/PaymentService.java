package com.example.ecommerce.service;

import com.example.ecommerce.dto.PaymentRequest;
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
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.UUID;

/**
 * NOTE: there is no real payment gateway here. Card / PayPal / bank transfer are
 * simulated as instantly COMPLETED; cash on delivery stays PENDING until an admin
 * marks it COMPLETED. Replace the marked block when a real gateway is added.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;

    // ---------------- customer ----------------

    @Transactional
    public PaymentResponse pay(String username, PaymentRequest request) {
        // ABA PayWay must go through its own checkout. Without this guard the simulated gateway below
        // would mark the order as paid without any money being received.
        if (request.method() == PaymentMethod.ABA_PAYWAY) {
            throw new BadRequestException("Use the ABA PayWay checkout for this payment method");
        }

        Order order = findOwnedOrderOrThrow(request.orderId(), username);

        if (order.getStatus() != OrderStatus.PENDING) {
            throw new BadRequestException("Order cannot be paid (status: " + order.getStatus() + ")");
        }
        if (paymentRepository.existsByOrderIdAndStatusIn(
                order.getId(), Set.of(PaymentStatus.PENDING, PaymentStatus.COMPLETED))) {
            throw new BadRequestException("This order already has a payment");
        }

        Payment payment = Payment.builder()
                .order(order)
                .amount(order.getTotalPrice()) // amount comes from the order, never from the client
                .method(request.method())
                .build();

        // --- simulated gateway (replace with a real gateway call later) ---
        if (request.method() == PaymentMethod.CASH_ON_DELIVERY) {
            payment.setStatus(PaymentStatus.PENDING);
        } else {
            payment.setStatus(PaymentStatus.COMPLETED);
            payment.setPaidAt(LocalDateTime.now());
            payment.setTransactionRef("TXN-" + UUID.randomUUID());
            order.setStatus(OrderStatus.PAID);
        }
        // ------------------------------------------------------------------

        return PaymentResponse.from(paymentRepository.save(payment));
    }

    public List<PaymentResponse> getPaymentsForMyOrder(Long orderId, String username) {
        Order order = findOwnedOrderOrThrow(orderId, username);
        return paymentRepository.findByOrderId(order.getId())
                .stream().map(PaymentResponse::from).toList();
    }

    // ---------------- admin ----------------

    public List<PaymentResponse> getAll() {
        return paymentRepository.findAll().stream().map(PaymentResponse::from).toList();
    }

    @Transactional
    public PaymentResponse updateStatus(Long paymentId, PaymentStatus newStatus) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found: " + paymentId));

        payment.setStatus(newStatus);

        if (newStatus == PaymentStatus.COMPLETED) {
            if (payment.getPaidAt() == null) {
                payment.setPaidAt(LocalDateTime.now());
            }
            Order order = payment.getOrder();
            if (order.getStatus() == OrderStatus.PENDING) {
                order.setStatus(OrderStatus.PAID);
            }
        }
        return PaymentResponse.from(payment);
    }

    // ---------------- helpers ----------------

    private Order findOwnedOrderOrThrow(Long orderId, String username) {
        return orderRepository.findById(orderId)
                .filter(o -> o.getUser().getUsername().equals(username))
                .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + orderId));
    }
}
