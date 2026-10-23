package com.example.ecommerce.security;

import com.example.ecommerce.config.JwtConfig;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import org.springframework.stereotype.Service;

import java.util.Date;

@Service
public class JwtService {

    private final JwtConfig config;

    public JwtService(JwtConfig config) {
        this.config = config;
    }

    public String generateToken(String username, String role) {
        Date now = new Date();
        return Jwts.builder()
                .subject(username)
                .claim("role", role)
                .issuedAt(now)
                .expiration(new Date(now.getTime() + config.getExpirationMs()))
                .signWith(config.getKey())
                .compact();
    }

    public String extractUsername(String token) {
        return parse(token).getSubject();
    }

    public boolean isValid(String token) {
        try {
            parse(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    public long getExpirationMs() {
        return config.getExpirationMs();
    }

    private Claims parse(String token) {
        return Jwts.parser().verifyWith(config.getKey()).build()
                .parseSignedClaims(token).getPayload();
    }
}
