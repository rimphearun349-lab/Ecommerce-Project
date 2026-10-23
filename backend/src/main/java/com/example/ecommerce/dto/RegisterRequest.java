package com.example.ecommerce.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank(message = "Username is required")
        @Size(min = 3, max = 50, message = "Username must be 3-50 characters")
        @Pattern(regexp = "^[A-Za-z0-9._-]*$", message = "Username can only contain letters, numbers, dot, dash and underscore")
        String username,

        @NotBlank(message = "Email is required")
        @Email(message = "Email is invalid")
        @Pattern(regexp = "^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$", message = "Email is invalid")
        @Size(max = 100, message = "Email must be at most 100 characters")
        String email,

        @NotBlank(message = "Password is required")
        @Size(min = 6, max = 72, message = "Password must be 6-72 characters")
        String password
) {
}
