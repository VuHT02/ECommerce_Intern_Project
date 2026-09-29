package com.example.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductResponse {
    private Long id;
    private Long categoryId;
    private String categoryName;
    private String sku;
    private String name;
    private String slug;
    private String description;
    private String brand;
    private BigDecimal price;
    private int stockQuantity;
    private String imageUrl;
    private boolean active;
    private List<String> detailImageUrls;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
