package com.example.demo.service;

import com.example.demo.dto.CategoryResponse;

import java.util.List;

public interface CategoryService {

    List<CategoryResponse> getCategoryTree();

    List<CategoryResponse> getAllActiveCategories();

    List<CategoryResponse> getShopFilterCategories();

    CategoryResponse getCategoryBySlug(String slug);
}
