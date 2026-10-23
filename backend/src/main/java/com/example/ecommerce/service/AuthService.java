package com.example.ecommerce.service;

import com.example.ecommerce.dto.AuthResponse;
import com.example.ecommerce.dto.LoginRequest;
import com.example.ecommerce.dto.RegisterRequest;
import com.example.ecommerce.dto.UserResponse;
import com.example.ecommerce.exception.ConflictException;
import com.example.ecommerce.exception.ResourceNotFoundException;
import com.example.ecommerce.exception.UnauthorizedException;
import com.example.ecommerce.model.Role;
import com.example.ecommerce.model.User;
import com.example.ecommerce.repository.UserRepository;
import com.example.ecommerce.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Register / login / profile.
 * login() returns a JWT token (STEP 09).
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @Transactional
    public UserResponse register(RegisterRequest request) {
        String username = request.username().trim();
        String email = request.email().trim().toLowerCase();

        if (userRepository.existsByUsername(username)) {
            throw new ConflictException("Username is already taken");
        }
        if (userRepository.existsByEmail(email)) {
            throw new ConflictException("Email is already registered");
        }

        User user = User.builder()
                .username(username)
                .email(email)
                .password(passwordEncoder.encode(request.password()))
                .role(Role.USER) // never taken from the request: new accounts are always USER
                .build();

        return UserResponse.from(userRepository.save(user));
    }

    /** Verifies the credentials and returns a JWT. Same error for unknown user and wrong password. */
    public AuthResponse login(LoginRequest request) {
        String identifier = request.usernameOrEmail().trim();

        User user = userRepository.findByUsername(identifier)
                .or(() -> userRepository.findByEmail(identifier.toLowerCase()))
                .filter(u -> passwordEncoder.matches(request.password(), u.getPassword()))
                .orElseThrow(() -> new UnauthorizedException("Invalid username/email or password"));

        String token = jwtService.generateToken(user.getUsername(), user.getRole().name());
        return AuthResponse.of(token, jwtService.getExpirationMs(), UserResponse.from(user));
    }

    public UserResponse getProfile(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return UserResponse.from(user);
    }
}
