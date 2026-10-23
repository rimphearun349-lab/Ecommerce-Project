package com.example.ecommerce.dto;

import com.example.ecommerce.model.PaymentStatus;
import jakarta.validation.constraints.NotNull;

public record PaymentStatusRequest(@NotNull(message = "Status is required") PaymentStatus status) {
}
