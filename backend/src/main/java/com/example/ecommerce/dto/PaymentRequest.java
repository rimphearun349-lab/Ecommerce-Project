package com.example.ecommerce.dto;

import com.example.ecommerce.model.PaymentMethod;
import jakarta.validation.constraints.NotNull;

public record PaymentRequest(
        @NotNull(message = "Order is required") Long orderId,
        @NotNull(message = "Payment method is required") PaymentMethod method
) {
}
