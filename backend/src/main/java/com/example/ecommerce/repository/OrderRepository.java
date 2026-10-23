package com.example.ecommerce.repository;

import com.example.ecommerce.model.Order;
import com.example.ecommerce.model.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.Collection;
import java.util.List;

public interface OrderRepository extends JpaRepository<Order, Long> {

    // A user's order history, newest first
    List<Order> findByUserIdOrderByOrderDateDesc(Long userId);

    // For the admin "Manage Orders" screen
    List<Order> findByStatus(OrderStatus status);

    // Revenue = total of the orders whose status is in the given list (0 when there are none)
    @Query("select coalesce(sum(o.totalPrice), 0) from Order o where o.status in :statuses")
    BigDecimal sumTotalPriceByStatusIn(@Param("statuses") Collection<OrderStatus> statuses);
}
