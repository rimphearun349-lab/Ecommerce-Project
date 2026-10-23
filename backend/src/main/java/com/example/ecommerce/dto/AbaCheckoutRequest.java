package com.example.ecommerce.dto;

import jakarta.validation.constraints.NotNull;

public record AbaCheckoutRequest(@NotNull(message = "Order is required") Long orderId) {
}
