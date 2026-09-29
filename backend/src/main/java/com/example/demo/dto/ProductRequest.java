package com.example.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductRequest {
    private Long categoryId;
    private String name;
    private String sku;
    private String slug;
    private String description;
    private String brand;
    private BigDecimal price;
    private int stockQuantity;
    private String imageUrl;
    @Builder.Default
    private boolean active = true;
    private List<String> detailImageUrls;
}
