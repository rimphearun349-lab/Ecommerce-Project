package com.example.ecommerce.dto;

import com.example.ecommerce.model.Order;
import com.example.ecommerce.model.OrderStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record OrderResponse(
        Long id,
        Long userId,
        String username,
        BigDecimal totalPrice,
        OrderStatus status,
        LocalDateTime orderDate,
        List<OrderItemResponse> items
) {
    public static OrderResponse from(Order order) {
        return new OrderResponse(
                order.getId(),
                order.getUser().getId(),
                order.getUser().getUsername(),
                order.getTotalPrice(),
                order.getStatus(),
                order.getOrderDate(),
                order.getItems().stream().map(OrderItemResponse::from).toList());
    }
}
