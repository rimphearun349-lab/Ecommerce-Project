package com.example.ecommerce.dto;

import com.example.ecommerce.model.Payment;
import com.example.ecommerce.model.PaymentMethod;
import com.example.ecommerce.model.PaymentStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record PaymentResponse(
        Long id,
        Long orderId,
        BigDecimal amount,
        PaymentMethod method,
        PaymentStatus status,
        String transactionRef,
        LocalDateTime paidAt
) {
    public static PaymentResponse from(Payment payment) {
        return new PaymentResponse(
                payment.getId(),
                payment.getOrder().getId(),
                payment.getAmount(),
                payment.getMethod(),
                payment.getStatus(),
                payment.getTransactionRef(),
                payment.getPaidAt());
    }
}
