package com.example.ecommerce.exception;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * The one JSON shape every error uses, so the frontend can always read "message".
 * fieldErrors is only present for validation errors: { "email": "Email is invalid" }.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiError(
        LocalDateTime timestamp,
        int status,
        String error,
        String message,
        String path,
        Map<String, String> fieldErrors
) {
}
