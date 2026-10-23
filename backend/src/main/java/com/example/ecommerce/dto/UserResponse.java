package com.example.ecommerce.dto;

import com.example.ecommerce.model.Role;
import com.example.ecommerce.model.User;

import java.time.LocalDateTime;

public record UserResponse(
        Long id,
        String username,
        String email,
        Role role,
        LocalDateTime createdAt
) {
    public static UserResponse from(User user) {
        return new UserResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getRole(),
                user.getCreatedAt());
    }
}
