package com.example.ecommerce.controller;

import com.example.ecommerce.dto.ReviewRequest;
import com.example.ecommerce.dto.ReviewResponse;
import com.example.ecommerce.security.AuthUtils;
import com.example.ecommerce.service.ReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;


    @GetMapping("/products/{productId}/reviews")
    public List<ReviewResponse> getByProduct(@PathVariable Long productId) {
        return reviewService.getByProduct(productId);
    }

    /** Logged-in user writes a review (one per product). */
    @PostMapping("/reviews")
    public ResponseEntity<ReviewResponse> create(@Valid @RequestBody ReviewRequest request,
                                                 Authentication authentication) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(reviewService.create(authentication.getName(), request));
    }

    /** Owner deletes their review; an admin can delete any review. */
    @DeleteMapping("/reviews/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id, Authentication authentication) {
        if (AuthUtils.isAdmin(authentication)) {
            reviewService.deleteAny(id);
        } else {
            reviewService.deleteMyReview(id, authentication.getName());
        }
    }
}
