package com.example.ecommerce.controller;

import com.example.ecommerce.dto.CreateOrderRequest;
import com.example.ecommerce.dto.OrderResponse;
import com.example.ecommerce.dto.OrderStatusRequest;
import com.example.ecommerce.model.OrderStatus;
import com.example.ecommerce.security.AuthUtils;
import com.example.ecommerce.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @PostMapping
    public ResponseEntity<OrderResponse> create(@Valid @RequestBody CreateOrderRequest request,
                                                Authentication authentication) {
        OrderResponse created = orderService.createOrder(authentication.getName(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /** Admin: all orders (optional ?status=PAID). Customer: only their own orders. */
    @GetMapping
    public List<OrderResponse> list(@RequestParam(required = false) OrderStatus status,
                                    Authentication authentication) {
        if (AuthUtils.isAdmin(authentication)) {
            return orderService.getAllOrders(status);
        }
        return orderService.getMyOrders(authentication.getName());
    }

    /** Admin can open any order; a customer only their own. */
    @GetMapping("/{id}")
    public OrderResponse getById(@PathVariable Long id, Authentication authentication) {
        if (AuthUtils.isAdmin(authentication)) {
            return orderService.getOrderById(id);
        }
        return orderService.getMyOrder(id, authentication.getName());
    }

    /** Admin: change order status. */
    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public OrderResponse updateStatus(@PathVariable Long id, @Valid @RequestBody OrderStatusRequest request) {
        return orderService.updateStatus(id, request.status());
    }

    /** Customer: cancel their own PENDING order. */
    @PutMapping("/{id}/cancel")
    public OrderResponse cancel(@PathVariable Long id, Authentication authentication) {
        return orderService.cancelMyOrder(id, authentication.getName());
    }
}
