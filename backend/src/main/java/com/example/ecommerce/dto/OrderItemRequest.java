package com.example.ecommerce.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record OrderItemRequest(
        @NotNull(message = "Product is required")
        Long productId,

        @NotNull(message = "Quantity is required")
        @Positive(message = "Quantity must be at least 1")
        @Max(value = 1000, message = "Quantity cannot be more than 1000")
        Integer quantity
) {
}
