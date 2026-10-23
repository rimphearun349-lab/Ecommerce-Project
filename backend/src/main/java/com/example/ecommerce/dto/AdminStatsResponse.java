package com.example.ecommerce.dto;

import java.math.BigDecimal;

/** Numbers shown on the admin dashboard cards. */
public record AdminStatsResponse(
        long totalProducts,
        long totalOrders,
        long totalUsers,
        BigDecimal totalRevenue
) {
}
