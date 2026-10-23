package com.example.ecommerce.config;

import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;

@Component
public class JwtConfig {

    private final SecretKey key;
    private final long expirationMs;

    public JwtConfig(@Value("${app.jwt.secret:}") String secret,
                     @Value("${app.jwt.expiration-ms:86400000}") long expirationMs) {
        if (secret == null || secret.getBytes(StandardCharsets.UTF_8).length < 32) {
            throw new IllegalStateException(
                    "JWT_SECRET must be set (environment variable) and at least 32 characters long.");
        }
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationMs = expirationMs;
    }

    public SecretKey getKey() {
        return key;
    }

    public long getExpirationMs() {
        return expirationMs;
    }
}
