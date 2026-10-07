package com.example.demo.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Ngoại lệ ném ra khi không tìm thấy sản phẩm theo ID hoặc Slug.
 * HTTP Status tương ứng: 404 NOT_FOUND
 */
@ResponseStatus(HttpStatus.NOT_FOUND)
public class ProductNotFoundException extends ResourceNotFoundException {

    public ProductNotFoundException(Long productId) {
        super("Không tìm thấy sản phẩm với ID: " + productId);
    }

    public ProductNotFoundException(String identifier) {
        super("Không tìm thấy sản phẩm: " + identifier);
    }
}
