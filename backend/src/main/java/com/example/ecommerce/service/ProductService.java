package com.example.ecommerce.service;

import com.example.ecommerce.dto.ProductRequest;
import com.example.ecommerce.dto.ProductResponse;
import com.example.ecommerce.exception.ConflictException;
import com.example.ecommerce.exception.ResourceNotFoundException;
import com.example.ecommerce.model.Category;
import com.example.ecommerce.model.Product;
import com.example.ecommerce.repository.CategoryRepository;
import com.example.ecommerce.repository.OrderItemRepository;
import com.example.ecommerce.repository.ProductRepository;
import com.example.ecommerce.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final OrderItemRepository orderItemRepository;
    private final ReviewRepository reviewRepository;

    public Page<ProductResponse> getAll(Pageable pageable) {
        return toResponses(productRepository.findAll(pageable));
    }

    public ProductResponse getById(Long id) {
        return toResponse(findOrThrow(id));
    }

    public Page<ProductResponse> getByCategory(Long categoryId, Pageable pageable) {
        if (!categoryRepository.existsById(categoryId)) {
            throw new ResourceNotFoundException("Category not found: " + categoryId);
        }
        return toResponses(productRepository.findByCategoryId(categoryId, pageable));
    }

    public Page<ProductResponse> search(String keyword, Pageable pageable) {
        String term = keyword == null ? "" : keyword.trim();
        return toResponses(productRepository.findByNameContainingIgnoreCase(term, pageable));
    }

    @Transactional
    public ProductResponse create(ProductRequest request) {
        Category category = findCategoryOrThrow(request.categoryId());

        Product product = Product.builder()
                .name(request.name().trim())
                .description(request.description())
                .price(request.price())
                .quantity(request.quantity())
                .image(request.image())
                .category(category)
                .build();

        return toResponse(productRepository.save(product));
    }

    @Transactional
    public ProductResponse update(Long id, ProductRequest request) {
        Product product = findOrThrow(id);
        Category category = findCategoryOrThrow(request.categoryId());

        product.setName(request.name().trim());
        product.setDescription(request.description());
        product.setPrice(request.price());
        product.setQuantity(request.quantity());
        product.setImage(request.image());
        product.setCategory(category);

        return toResponse(product);
    }

    @Transactional
    public void delete(Long id) {
        Product product = findOrThrow(id);
        if (orderItemRepository.existsByProductId(id)) {
            throw new ConflictException("Cannot delete a product that appears in existing orders");
        }
        productRepository.delete(product);
    }

    // ---------------- helpers ----------------

    private record RatingSummary(double average, long count) {
        static final RatingSummary EMPTY = new RatingSummary(0, 0);
    }

    // Average rating and review count for a group of products, using a single query.
    private Map<Long, RatingSummary> ratingsFor(Collection<Product> products) {
        Map<Long, RatingSummary> result = new HashMap<>();
        if (products.isEmpty()) {
            return result;
        }
        List<Long> ids = products.stream().map(Product::getId).toList();
        for (Object[] row : reviewRepository.summarizeByProductIds(ids)) {
            double average = Math.round(((Number) row[1]).doubleValue() * 10.0) / 10.0; // 1 decimal
            result.put((Long) row[0], new RatingSummary(average, ((Number) row[2]).longValue()));
        }
        return result;
    }

    private Page<ProductResponse> toResponses(Page<Product> page) {
        Map<Long, RatingSummary> ratings = ratingsFor(page.getContent());
        return page.map(product -> {
            RatingSummary summary = ratings.getOrDefault(product.getId(), RatingSummary.EMPTY);
            return ProductResponse.from(product, summary.average(), summary.count());
        });
    }

    private ProductResponse toResponse(Product product) {
        RatingSummary summary = ratingsFor(List.of(product)).getOrDefault(product.getId(), RatingSummary.EMPTY);
        return ProductResponse.from(product, summary.average(), summary.count());
    }

    private Product findOrThrow(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + id));
    }

    private Category findCategoryOrThrow(Long categoryId) {
        return categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found: " + categoryId));
    }
}
