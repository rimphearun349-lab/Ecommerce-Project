package com.example.ecommerce.dto;

import com.example.ecommerce.model.OrderItem;

import java.math.BigDecimal;

public record OrderItemResponse(
        Long productId,
        String productName,
        Integer quantity,
        BigDecimal price,
        BigDecimal subtotal
) {
    public static OrderItemResponse from(OrderItem item) {
        return new OrderItemResponse(
                item.getProduct().getId(),
                item.getProduct().getName(),
                item.getQuantity(),
                item.getPrice(),
                item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity())));
    }
}
