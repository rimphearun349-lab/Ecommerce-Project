package com.example.ecommerce.repository;

import com.example.ecommerce.model.Product;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Long> {

    // Products in a category (paged)
    Page<Product> findByCategoryId(Long categoryId, Pageable pageable);

    // Search by name, case-insensitive (paged)
    Page<Product> findByNameContainingIgnoreCase(String keyword, Pageable pageable);

    // Used to block deleting a category that still has products
    boolean existsByCategoryId(Long categoryId);

    // Locks the row while stock is checked and reduced, so two customers
    // cannot buy the last item at the same time. Use inside @Transactional.
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from Product p where p.id = :id")
    Optional<Product> findByIdForUpdate(@Param("id") Long id);
}
