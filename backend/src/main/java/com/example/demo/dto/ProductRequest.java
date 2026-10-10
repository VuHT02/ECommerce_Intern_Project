package com.example.demo.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductRequest {
    @NotNull(message = "Vui lòng chọn danh mục.")
    private Long categoryId;
    @NotBlank(message = "Tên sản phẩm không được để trống.")
    @Size(max = 200)
    private String name;
    @NotBlank(message = "SKU không được để trống.")
    @Size(max = 50)
    private String sku;
    @Size(max = 220)
    private String slug;
    private String description;
    @Size(max = 100)
    private String brand;
    @NotNull(message = "Giá sản phẩm là bắt buộc.")
    @DecimalMin(value = "0.01", message = "Giá sản phẩm phải lớn hơn 0.")
    private BigDecimal price;
    @Min(value = 0, message = "Tồn kho không được âm.")
    private int stockQuantity;
    private String imageUrl;
    @Builder.Default
    private boolean active = true;
    private List<String> detailImageUrls;
    private Map<String, String> specifications;
}
