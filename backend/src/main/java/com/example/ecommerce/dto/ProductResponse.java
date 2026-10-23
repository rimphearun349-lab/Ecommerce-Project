package com.example.ecommerce.dto;

import com.example.ecommerce.model.Product;

import java.math.BigDecimal;

public record ProductResponse(
        Long id,
        String name,
        String description,
        BigDecimal price,
        Integer quantity,
        String image,
        Long categoryId,
        String categoryName,
        double averageRating,
        long reviewCount
) {
    public static ProductResponse from(Product product, double averageRating, long reviewCount) {
        return new ProductResponse(
                product.getId(),
                product.getName(),
                product.getDescription(),
                product.getPrice(),
                product.getQuantity(),
                product.getImage(),
                product.getCategory().getId(),
                product.getCategory().getName(),
                averageRating,
                reviewCount);
    }
}
