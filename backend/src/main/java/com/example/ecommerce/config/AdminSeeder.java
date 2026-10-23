package com.example.ecommerce.config;

import com.example.ecommerce.model.Role;
import com.example.ecommerce.model.User;
import com.example.ecommerce.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class AdminSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.username:admin}")
    private String username;

    @Value("${app.admin.email:admin@example.com}")
    private String email;

    @Value("${app.admin.password:}")
    private String password;

    @Override
    public void run(String... args) {
        if (password == null || password.isBlank()) {
            log.warn("ADMIN_PASSWORD is not set - no admin account was created.");
            return;
        }
        var existing = userRepository.findByUsername(username);
        if (existing.isPresent()) {
            // The account may already exist as a normal USER (e.g. registered through /api/auth/register).
            // Without this it would stay USER forever and every admin endpoint would answer 403.
            User user = existing.get();
            if (user.getRole() != Role.ADMIN) {
                user.setRole(Role.ADMIN);
                userRepository.save(user);
                log.warn("Existing account '{}' was promoted to ADMIN.", username);
            }
            return;
        }
        User admin = User.builder()
                .username(username)
                .email(email.toLowerCase())
                .password(passwordEncoder.encode(password))
                .role(Role.ADMIN)
                .build();
        userRepository.save(admin);
        log.info("Admin account '{}' created.", username);
    }
}
