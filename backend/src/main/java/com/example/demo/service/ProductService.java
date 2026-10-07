package com.example.demo.service;

import com.example.demo.dto.ProductRequest;
import com.example.demo.dto.ProductResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;

public interface ProductService {

    Page<ProductResponse> getAllProducts(Pageable pageable);

    ProductResponse getProductById(Long id);

    ProductResponse getProductBySlug(String slug);

    Page<ProductResponse> searchProducts(Long categoryId, String categoryName, String keyword, String brand, BigDecimal minPrice, BigDecimal maxPrice, Pageable pageable);

    default Page<ProductResponse> searchProducts(String categoryName, String keyword, String brand, BigDecimal minPrice, BigDecimal maxPrice, Pageable pageable) {
        return searchProducts(null, categoryName, keyword, brand, minPrice, maxPrice, pageable);
    }

    default Page<ProductResponse> searchProducts(String categoryName, String keyword, BigDecimal minPrice, BigDecimal maxPrice, Pageable pageable) {
        return searchProducts(null, categoryName, keyword, "", minPrice, maxPrice, pageable);
    }

    ProductResponse createProduct(ProductRequest request);

    ProductResponse updateProduct(Long id, ProductRequest request);

    void deleteProduct(Long id);

    void updateStock(Long id, int quantityDelta);
}
