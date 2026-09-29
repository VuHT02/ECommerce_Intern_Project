package com.example.demo.service.impl;

import com.example.demo.dto.CategoryResponse;
import com.example.demo.entity.Category;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.repository.CategoryRepository;
import com.example.demo.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;

    @Override
    @Transactional(readOnly = true)
    public List<CategoryResponse> getCategoryTree() {
        List<Category> rootCategories = categoryRepository.findByParentCategoryIsNullAndActiveTrue();
        List<CategoryResponse> responseList = new ArrayList<>();
        for (Category root : rootCategories) {
            responseList.add(mapToTreeResponse(root));
        }
        return responseList;
    }

    @Override
    @Transactional(readOnly = true)
    public List<CategoryResponse> getAllActiveCategories() {
        return categoryRepository.findByActiveTrue().stream()
                .map(this::mapToSimpleResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public CategoryResponse getCategoryBySlug(String slug) {
        Category category = categoryRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy danh mục với slug: " + slug));
        return mapToTreeResponse(category);
    }

    private CategoryResponse mapToTreeResponse(Category cat) {
        List<CategoryResponse> subResponses = new ArrayList<>();
        if (cat.getSubcategories() != null) {
            for (Category sub : cat.getSubcategories()) {
                if (sub.isActive()) {
                    subResponses.add(mapToTreeResponse(sub));
                }
            }
        }

        return CategoryResponse.builder()
                .id(cat.getId())
                .name(cat.getName())
                .slug(cat.getSlug())
                .parentCategoryId(cat.getParentCategory() != null ? cat.getParentCategory().getId() : null)
                .subcategories(subResponses)
                .active(cat.isActive())
                .build();
    }

    private CategoryResponse mapToSimpleResponse(Category cat) {
        return CategoryResponse.builder()
                .id(cat.getId())
                .name(cat.getName())
                .slug(cat.getSlug())
                .parentCategoryId(cat.getParentCategory() != null ? cat.getParentCategory().getId() : null)
                .active(cat.isActive())
                .build();
    }
}
