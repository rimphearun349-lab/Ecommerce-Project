package com.example.ecommerce.service;

import com.example.ecommerce.dto.AdminStatsResponse;
import com.example.ecommerce.dto.UserResponse;
import com.example.ecommerce.model.OrderStatus;
import com.example.ecommerce.repository.OrderRepository;
import com.example.ecommerce.repository.ProductRepository;
import com.example.ecommerce.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminService {

    // Only orders that were actually paid count as revenue
    private static final List<OrderStatus> REVENUE_STATUSES =
            List.of(OrderStatus.PAID, OrderStatus.SHIPPED, OrderStatus.DELIVERED);

    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;

    public AdminStatsResponse getStats() {
        return new AdminStatsResponse(
                productRepository.count(),
                orderRepository.count(),
                userRepository.count(),
                orderRepository.sumTotalPriceByStatusIn(REVENUE_STATUSES));
    }

    public List<UserResponse> getUsers() {
        return userRepository.findAll(Sort.by(Sort.Direction.DESC, "id"))
                .stream().map(UserResponse::from).toList();
    }
}
