package com.example.ecommerce.dto;

import com.example.ecommerce.model.OrderStatus;
import jakarta.validation.constraints.NotNull;

public record OrderStatusRequest(@NotNull(message = "Status is required") OrderStatus status) {
}
