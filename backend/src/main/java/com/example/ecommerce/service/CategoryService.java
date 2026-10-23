package com.example.ecommerce.service;

import com.example.ecommerce.dto.CategoryRequest;
import com.example.ecommerce.dto.CategoryResponse;
import com.example.ecommerce.exception.ConflictException;
import com.example.ecommerce.exception.ResourceNotFoundException;
import com.example.ecommerce.model.Category;
import com.example.ecommerce.repository.CategoryRepository;
import com.example.ecommerce.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;

    public List<CategoryResponse> getAll() {
        return categoryRepository.findAll().stream().map(CategoryResponse::from).toList();
    }

    public CategoryResponse getById(Long id) {
        return CategoryResponse.from(findOrThrow(id));
    }

    @Transactional
    public CategoryResponse create(CategoryRequest request) {
        String name = request.name().trim();
        if (categoryRepository.existsByName(name)) {
            throw new ConflictException("Category already exists: " + name);
        }
        Category category = Category.builder().name(name).build();
        return CategoryResponse.from(categoryRepository.save(category));
    }

    @Transactional
    public CategoryResponse update(Long id, CategoryRequest request) {
        Category category = findOrThrow(id);
        String name = request.name().trim();

        boolean usedByAnother = categoryRepository.findByName(name)
                .filter(other -> !other.getId().equals(id))
                .isPresent();
        if (usedByAnother) {
            throw new ConflictException("Category already exists: " + name);
        }

        category.setName(name);
        return CategoryResponse.from(category);
    }

    @Transactional
    public void delete(Long id) {
        Category category = findOrThrow(id);
        if (productRepository.existsByCategoryId(id)) {
            throw new ConflictException("Cannot delete a category that still has products");
        }
        categoryRepository.delete(category);
    }

    private Category findOrThrow(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found: " + id));
    }
}
