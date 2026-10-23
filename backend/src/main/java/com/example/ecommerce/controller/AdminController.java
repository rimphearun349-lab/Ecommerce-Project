package com.example.ecommerce.controller;

import com.example.ecommerce.dto.AdminStatsResponse;
import com.example.ecommerce.dto.UserResponse;
import com.example.ecommerce.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Admin dashboard data. Every endpoint here needs the ADMIN role. */
@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/stats")
    public AdminStatsResponse stats() {
        return adminService.getStats();
    }

    @GetMapping("/users")
    public List<UserResponse> users() {
        return adminService.getUsers();
    }
}
