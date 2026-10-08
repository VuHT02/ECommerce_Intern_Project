package com.example.demo.controller;

import com.example.demo.dto.ApiResponse;
import com.example.demo.dto.CategoryResponse;
import com.example.demo.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * CategoryController - Quản lý danh mục sản phẩm
 *
 * GET /api/categories          → Cây danh mục đa cấp (dùng cho menu navbar)
 * GET /api/categories/all      → Danh sách phẳng tất cả danh mục active
 * GET /api/categories/{slug}   → Chi tiết 1 danh mục theo slug
 */
@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<CategoryResponse>>> getCategoryTree() {
        return ResponseEntity.ok(
                ApiResponse.success("Lấy cây danh mục thành công", categoryService.getCategoryTree())
        );
    }

    @GetMapping("/all")
    public ResponseEntity<ApiResponse<List<CategoryResponse>>> getAllActiveCategories() {
        return ResponseEntity.ok(
                ApiResponse.success("Lấy danh sách danh mục thành công", categoryService.getAllActiveCategories())
        );
    }

    @GetMapping("/shop")
    public ResponseEntity<ApiResponse<List<CategoryResponse>>> getShopFilterCategories() {
        return ResponseEntity.ok(
                ApiResponse.success("Lấy danh mục cửa hàng thành công", categoryService.getShopFilterCategories())
        );
    }

    @GetMapping("/{slug}")
    public ResponseEntity<ApiResponse<CategoryResponse>> getCategoryBySlug(@PathVariable String slug) {
        return ResponseEntity.ok(
                ApiResponse.success(categoryService.getCategoryBySlug(slug))
        );
    }
}
