package com.example.ecommerce.repository;

import com.example.ecommerce.model.Payment;
import com.example.ecommerce.model.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    List<Payment> findByOrderId(Long orderId);

    // ABA PayWay identifies a payment by the tran_id we sent it
    Optional<Payment> findByTransactionRef(String transactionRef);

    // Used to stop an order being paid twice
    boolean existsByOrderIdAndStatusIn(Long orderId, Collection<PaymentStatus> statuses);
}
