package com.example.ecommerce.security;

import org.springframework.security.core.Authentication;

public final class AuthUtils {

    private AuthUtils() {
    }

    public static boolean isAdmin(Authentication authentication) {
        return authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
    }
}
