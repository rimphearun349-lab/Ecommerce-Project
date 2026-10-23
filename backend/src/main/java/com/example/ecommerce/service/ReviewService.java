package com.example.ecommerce.service;

import com.example.ecommerce.dto.ReviewRequest;
import com.example.ecommerce.dto.ReviewResponse;
import com.example.ecommerce.exception.ConflictException;
import com.example.ecommerce.exception.ResourceNotFoundException;
import com.example.ecommerce.model.Product;
import com.example.ecommerce.model.Review;
import com.example.ecommerce.model.User;
import com.example.ecommerce.repository.ProductRepository;
import com.example.ecommerce.repository.ReviewRepository;
import com.example.ecommerce.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;

    public List<ReviewResponse> getByProduct(Long productId) {
        if (!productRepository.existsById(productId)) {
            throw new ResourceNotFoundException("Product not found: " + productId);
        }
        return reviewRepository.findByProductId(productId)
                .stream().map(ReviewResponse::from).toList();
    }

    @Transactional
    public ReviewResponse create(String username, ReviewRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Product product = productRepository.findById(request.productId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + request.productId()));

        if (reviewRepository.existsByUserIdAndProductId(user.getId(), product.getId())) {
            throw new ConflictException("You have already reviewed this product");
        }

        Review review = Review.builder()
                .user(user)
                .product(product)
                .rating(request.rating())
                .comment(request.comment())
                .build();

        return ReviewResponse.from(reviewRepository.save(review));
    }

    /** A customer can delete only their own review. */
    @Transactional
    public void deleteMyReview(Long reviewId, String username) {
        Review review = reviewRepository.findById(reviewId)
                .filter(r -> r.getUser().getUsername().equals(username))
                .orElseThrow(() -> new ResourceNotFoundException("Review not found: " + reviewId));
        reviewRepository.delete(review);
    }

    /** Admin moderation. */
    @Transactional
    public void deleteAny(Long reviewId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found: " + reviewId));
        reviewRepository.delete(review);
    }
}
