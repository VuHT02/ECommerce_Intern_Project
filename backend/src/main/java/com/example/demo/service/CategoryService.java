package com.example.demo.service;

import com.example.demo.dto.CategoryResponse;

import java.util.List;

public interface CategoryService {

    List<CategoryResponse> getCategoryTree();

    List<CategoryResponse> getAllActiveCategories();

    CategoryResponse getCategoryBySlug(String slug);
}
