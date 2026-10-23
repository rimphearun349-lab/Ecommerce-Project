package com.example.ecommerce.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record CreateOrderRequest(
        @NotEmpty(message = "An order needs at least one item")
        @Valid
        List<OrderItemRequest> items
) {
}
