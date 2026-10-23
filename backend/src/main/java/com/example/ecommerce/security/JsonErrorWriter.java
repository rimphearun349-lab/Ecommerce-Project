package com.example.ecommerce.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.access.AccessDeniedHandler;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;

/**
 * Errors raised by the security filters (before any controller runs) never reach
 * GlobalExceptionHandler, so they are written as JSON here in the same shape.
 */
public final class JsonErrorWriter {

    private JsonErrorWriter() {
    }

    /** 401: no token, expired token or invalid token. */
    public static final AuthenticationEntryPoint UNAUTHORIZED = (request, response, ex) ->
            write(request, response, HttpStatus.UNAUTHORIZED, "Please log in to continue");

    /** 403: logged in, but not allowed (for example a USER calling an admin URL). */
    public static final AccessDeniedHandler FORBIDDEN = (request, response, ex) ->
            write(request, response, HttpStatus.FORBIDDEN, "You do not have permission to perform this action");

    private static void write(HttpServletRequest request, HttpServletResponse response, HttpStatus status,
                              String message) throws IOException {
        response.setStatus(status.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.getWriter().write("{\"timestamp\":\"" + LocalDateTime.now() + "\","
                + "\"status\":" + status.value() + ","
                + "\"error\":\"" + status.getReasonPhrase() + "\","
                + "\"message\":\"" + message + "\","
                + "\"path\":\"" + escape(request.getRequestURI()) + "\"}");
    }

    private static String escape(String text) {
        return text.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
