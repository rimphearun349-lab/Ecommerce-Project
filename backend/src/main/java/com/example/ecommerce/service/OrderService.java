package com.example.ecommerce.service;

import com.example.ecommerce.dto.CreateOrderRequest;
import com.example.ecommerce.dto.OrderItemRequest;
import com.example.ecommerce.dto.OrderResponse;
import com.example.ecommerce.exception.BadRequestException;
import com.example.ecommerce.exception.ResourceNotFoundException;
import com.example.ecommerce.model.Order;
import com.example.ecommerce.model.OrderItem;
import com.example.ecommerce.model.OrderStatus;
import com.example.ecommerce.model.Product;
import com.example.ecommerce.model.User;
import com.example.ecommerce.repository.OrderRepository;
import com.example.ecommerce.repository.ProductRepository;
import com.example.ecommerce.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class OrderService {

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final PayWayService payWayService;

    // ---------------- customer ----------------

    /**
     * Places an order: checks stock, reduces stock, snapshots each unit price,
     * and calculates the total on the server (never trusted from the client).
     */
    @Transactional
    public OrderResponse createOrder(String username, CreateOrderRequest request) {
        User user = findUserOrThrow(username);

        Order order = Order.builder()
                .user(user)
                .status(OrderStatus.PENDING)
                .totalPrice(BigDecimal.ZERO)
                .build();

        // Lock products in a fixed (id) order so two orders cannot deadlock each other.
        List<OrderItemRequest> lines = request.items().stream()
                .sorted(Comparator.comparing(OrderItemRequest::productId))
                .toList();

        BigDecimal total = BigDecimal.ZERO;
        for (OrderItemRequest line : lines) {
            Product product = productRepository.findByIdForUpdate(line.productId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + line.productId()));

            if (product.getQuantity() <= 0) {
                throw new BadRequestException(product.getName() + " is out of stock");
            }
            if (product.getQuantity() < line.quantity()) {
                throw new BadRequestException("Insufficient stock for " + product.getName()
                        + ": requested " + line.quantity() + ", only " + product.getQuantity() + " available");
            }
            product.setQuantity(product.getQuantity() - line.quantity());

            OrderItem item = OrderItem.builder()
                    .product(product)
                    .quantity(line.quantity())
                    .price(product.getPrice())
                    .build();
            order.addItem(item);

            total = total.add(product.getPrice().multiply(BigDecimal.valueOf(line.quantity())));
        }
        order.setTotalPrice(total);

        return OrderResponse.from(orderRepository.save(order));
    }

    public List<OrderResponse> getMyOrders(String username) {
        User user = findUserOrThrow(username);
        return orderRepository.findByUserIdOrderByOrderDateDesc(user.getId())
                .stream().map(OrderResponse::from).toList();
    }

    /** A customer can only see their own order (someone else's order looks like "not found"). */
    public OrderResponse getMyOrder(Long orderId, String username) {
        return OrderResponse.from(findOwnedOrderOrThrow(orderId, username));
    }

    @Transactional
    public OrderResponse cancelMyOrder(Long orderId, String username) {
        Order order = findOwnedOrderOrThrow(orderId, username);
        // The customer may have paid on ABA PayWay without coming back yet: check that first,
        // so a paid order is never cancelled.
        payWayService.refreshPendingAbaPayments(order.getId());
        if (order.getStatus() != OrderStatus.PENDING) {
            throw new BadRequestException("Only pending orders can be cancelled");
        }
        restoreStock(order);
        order.setStatus(OrderStatus.CANCELLED);
        payWayService.markPendingAbaPaymentsFailed(order.getId());
        return OrderResponse.from(order);
    }

    // ---------------- admin ----------------

    public List<OrderResponse> getAllOrders(OrderStatus status) {
        List<Order> orders = (status == null)
                ? orderRepository.findAll(Sort.by(Sort.Direction.DESC, "orderDate"))
                : orderRepository.findByStatus(status);
        return orders.stream().map(OrderResponse::from).toList();
    }

    public OrderResponse getOrderById(Long orderId) {
        return OrderResponse.from(findOrderOrThrow(orderId));
    }

    @Transactional
    public OrderResponse updateStatus(Long orderId, OrderStatus newStatus) {
        Order order = findOrderOrThrow(orderId);

        if (order.getStatus() == OrderStatus.DELIVERED || order.getStatus() == OrderStatus.CANCELLED) {
            throw new BadRequestException("Order is already " + order.getStatus() + " and cannot be changed");
        }
        if (newStatus == OrderStatus.CANCELLED) {
            restoreStock(order);
        }
        order.setStatus(newStatus);
        return OrderResponse.from(order);
    }

    // ---------------- helpers ----------------

    private void restoreStock(Order order) {
        for (OrderItem item : order.getItems()) {
            Product product = productRepository.findByIdForUpdate(item.getProduct().getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + item.getProduct().getId()));
            product.setQuantity(product.getQuantity() + item.getQuantity());
        }
    }

    private User findUserOrThrow(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private Order findOrderOrThrow(Long orderId) {
        return orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + orderId));
    }

    private Order findOwnedOrderOrThrow(Long orderId, String username) {
        Order order = findOrderOrThrow(orderId);
        if (!order.getUser().getUsername().equals(username)) {
            throw new ResourceNotFoundException("Order not found: " + orderId);
        }
        return order;
    }
}
