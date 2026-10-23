package com.example.ecommerce.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record ProductRequest(
        @NotBlank(message = "Product name is required")
        @Size(max = 150, message = "Product name must be at most 150 characters")
        String name,

        String description,

        @NotNull(message = "Price is required")
        @PositiveOrZero(message = "Price cannot be negative")
        BigDecimal price,

        @NotNull(message = "Quantity is required")
        @PositiveOrZero(message = "Quantity cannot be negative")
        Integer quantity,

        @Size(max = 255, message = "Image must be at most 255 characters")
        String image,

        @NotNull(message = "Category is required")
        Long categoryId
) {
}
