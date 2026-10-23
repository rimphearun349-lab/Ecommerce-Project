package com.example.ecommerce.repository;

import com.example.ecommerce.model.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface ReviewRepository extends JpaRepository<Review, Long> {

    List<Review> findByProductId(Long productId);

    // One review per user per product
    boolean existsByUserIdAndProductId(Long userId, Long productId);

    // One query for many products. Each row: [productId, average rating, number of reviews]
    @Query("select r.product.id, avg(r.rating), count(r) from Review r "
            + "where r.product.id in :ids group by r.product.id")
    List<Object[]> summarizeByProductIds(@Param("ids") Collection<Long> ids);
}
