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
import java.util.Comparator;
import java.util.List;
import java.util.Locale;

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
    public List<CategoryResponse> getShopFilterCategories() {
        List<CategoryResponse> result = new ArrayList<>();
        java.util.Set<Integer> seen = new java.util.HashSet<>();
        categoryRepository.findByActiveTrue().stream()
                .filter(this::isMainShopCategory)
                .sorted(Comparator.comparingInt(this::shopCategoryOrder))
                .forEach((cat) -> {
                    int order = shopCategoryOrder(cat);
                    if (seen.add(order)) {
                        result.add(mapToSimpleResponse(cat));
                    }
                });
        return result;
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

    private boolean isMainShopCategory(Category cat) {
        String slug = safeSlug(cat);
        String name = cat.getName() == null ? "" : cat.getName().toLowerCase(Locale.ROOT);
        if (isLaptopSubtype(slug, name) || isElectronicsRoot(slug, name)) {
            return false;
        }
        return shopCategoryOrder(cat) < 90;
    }

    private int shopCategoryOrder(Category cat) {
        String slug = safeSlug(cat);
        String name = cat.getName() == null ? "" : cat.getName().toLowerCase(Locale.ROOT);
        if (slug.equals("laptop") || slug.equals("may-tinh-laptop") || slug.equals("may-tinh")
                || name.equals("laptop") || name.contains("m\u00e1y t\u00ednh & laptop")) {
            return 1;
        }
        if (slug.contains("dien-thoai") || slug.contains("phone") || name.contains("\u0111i\u1ec7n tho\u1ea1i")
                || name.contains("dien thoai")) {
            return 2;
        }
        if (slug.contains("may-tinh-bang") || slug.contains("tablet") || name.contains("m\u00e1y t\u00ednh b\u1ea3ng")
                || name.contains("may tinh bang") || name.contains("tablet")) {
            return 3;
        }
        if (slug.contains("phu-kien") || slug.contains("accessor") || name.contains("ph\u1ee5 ki\u1ec7n")
                || name.contains("phu kien")) {
            return 4;
        }
        return 90;
    }

    private static boolean isLaptopSubtype(String slug, String name) {
        String haystack = slug + " " + name;
        return haystack.contains("van-phong") || haystack.contains("van phong")
                || haystack.contains("gaming") || haystack.contains("do-hoa")
                || haystack.contains("do hoa") || haystack.contains("\u0111\u1ed3 h\u1ecda");
    }

    private static boolean isElectronicsRoot(String slug, String name) {
        return slug.equals("dien-tu") || slug.contains("electronic")
                || name.contains("thi\u1ebft b\u1ecb \u0111i\u1ec7n t\u1eed")
                || name.contains("thiet bi dien tu");
    }

    private static String safeSlug(Category cat) {
        return cat.getSlug() == null ? "" : cat.getSlug().toLowerCase(Locale.ROOT);
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
