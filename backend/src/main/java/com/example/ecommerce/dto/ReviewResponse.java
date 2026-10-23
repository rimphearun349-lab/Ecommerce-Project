package com.example.ecommerce.dto;

import com.example.ecommerce.model.Review;

import java.time.LocalDateTime;

public record ReviewResponse(
        Long id,
        Long userId,
        String username,
        Long productId,
        Integer rating,
        String comment,
        LocalDateTime createdAt
) {
    public static ReviewResponse from(Review review) {
        return new ReviewResponse(
                review.getId(),
                review.getUser().getId(),
                review.getUser().getUsername(),
                review.getProduct().getId(),
                review.getRating(),
                review.getComment(),
                review.getCreatedAt());
    }
}
