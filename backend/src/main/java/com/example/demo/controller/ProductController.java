package com.example.demo.controller;

import com.example.demo.dto.ApiResponse;
import com.example.demo.dto.ProductRequest;
import com.example.demo.dto.ProductResponse;
import com.example.demo.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;

/**
 * ProductController - Quản lý sản phẩm điện tử (Máy tính & Điện thoại)
 *
 * GET  /api/products                    → Danh sách sản phẩm (phân trang, sắp xếp)
 * GET  /api/products/search             → Tìm kiếm nâng cao theo tên, danh mục, khoảng giá
 * GET  /api/products/{id}               → Chi tiết sản phẩm theo ID
 * GET  /api/products/slug/{slug}        → Chi tiết sản phẩm theo slug (SEO-friendly)
 * POST /api/products                    → Tạo mới sản phẩm [Admin]
 * PUT  /api/products/{id}               → Cập nhật sản phẩm [Admin]
 * DELETE /api/products/{id}             → Xóa mềm sản phẩm (isActive = false) [Admin]
 */
@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    /**
     * Helper tạo Pageable an toàn chống SQL injection và lỗi thuộc tính sort
     */
    private Pageable buildPageable(int page, int size, String sortBy, String sortDir) {
        String cleanSortBy = "createdAt";
        if ("price".equalsIgnoreCase(sortBy)) {
            cleanSortBy = "price";
        } else if ("name".equalsIgnoreCase(sortBy)) {
            cleanSortBy = "name";
        } else if ("id".equalsIgnoreCase(sortBy)) {
            cleanSortBy = "id";
        }
        Sort.Direction direction = "asc".equalsIgnoreCase(sortDir) ? Sort.Direction.ASC : Sort.Direction.DESC;
        return PageRequest.of(Math.max(0, page), Math.max(1, size), Sort.by(direction, cleanSortBy));
    }

    /**
     * GET /api/products?page=0&size=12&sortBy=price&sortDir=asc&categoryId=1
     * Lấy danh sách sản phẩm có phân trang, lọc và sắp xếp
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<ProductResponse>>> getAllProducts(
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false, defaultValue = "") String categoryName,
            @RequestParam(required = false, defaultValue = "") String keyword,
            @RequestParam(required = false, defaultValue = "") String brand,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        Pageable pageable = buildPageable(page, size, sortBy, sortDir);

        boolean hasFilters = categoryId != null || !categoryName.isEmpty() || !keyword.isEmpty()
                || !brand.isEmpty() || minPrice != null || maxPrice != null;

        Page<ProductResponse> result = hasFilters
                ? productService.searchProducts(categoryId, categoryName, keyword, brand, minPrice, maxPrice, pageable)
                : productService.getAllProducts(pageable);

        return ResponseEntity.ok(
                ApiResponse.success("Lấy danh sách sản phẩm thành công", result)
        );
    }

    /**
     * GET /api/products/search?categoryId=1&categoryName=Laptop&keyword=MacBook&minPrice=10000000&maxPrice=50000000&sortBy=price&sortDir=asc
     * Tìm kiếm sản phẩm nâng cao theo danh mục, từ khóa, thương hiệu, khoảng giá và sắp xếp
     */
    @GetMapping("/search")
    public ResponseEntity<ApiResponse<Page<ProductResponse>>> searchProducts(
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false, defaultValue = "") String categoryName,
            @RequestParam(required = false, defaultValue = "") String keyword,
            @RequestParam(required = false, defaultValue = "") String brand,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        Pageable pageable = buildPageable(page, size, sortBy, sortDir);

        return ResponseEntity.ok(
                ApiResponse.success("Tìm kiếm sản phẩm thành công",
                        productService.searchProducts(categoryId, categoryName, keyword, brand, minPrice, maxPrice, pageable))
        );
    }

    /**
     * GET /api/products/{id}
     * Chi tiết sản phẩm theo ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProductResponse>> getProductById(@PathVariable Long id) {
        return ResponseEntity.ok(
                ApiResponse.success(productService.getProductById(id))
        );
    }

    /**
     * GET /api/products/slug/{slug}
     * Chi tiết sản phẩm theo slug (URL thân thiện SEO)
     * Ví dụ: /api/products/slug/iphone-15-pro-max-256gb-titan
     */
    @GetMapping("/slug/{slug}")
    public ResponseEntity<ApiResponse<ProductResponse>> getProductBySlug(@PathVariable String slug) {
        return ResponseEntity.ok(
                ApiResponse.success(productService.getProductBySlug(slug))
        );
    }

    /**
     * POST /api/products
     * Tạo mới sản phẩm [Dành cho Admin]
     * Body: ProductRequest JSON
     */
    @PostMapping
    public ResponseEntity<ApiResponse<ProductResponse>> createProduct(@RequestBody ProductRequest request) {
        ProductResponse created = productService.createProduct(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo sản phẩm mới thành công", created));
    }

    /**
     * PUT /api/products/{id}
     * Cập nhật thông tin sản phẩm [Dành cho Admin]
     * Body: ProductRequest JSON
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ProductResponse>> updateProduct(
            @PathVariable Long id,
            @RequestBody ProductRequest request) {
        return ResponseEntity.ok(
                ApiResponse.success("Cập nhật sản phẩm thành công", productService.updateProduct(id, request))
        );
    }

    /**
     * DELETE /api/products/{id}
     * Xóa mềm sản phẩm (đặt isActive = false) [Dành cho Admin]
     * Không xóa cứng để bảo toàn lịch sử đơn hàng
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteProduct(@PathVariable Long id) {
        productService.deleteProduct(id);
        return ResponseEntity.ok(
                ApiResponse.success("Đã xóa sản phẩm khỏi danh sách kinh doanh", null)
        );
    }
}
