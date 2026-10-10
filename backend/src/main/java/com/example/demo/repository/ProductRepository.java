package com.example.demo.repository;

import com.example.demo.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long>, JpaSpecificationExecutor<Product> {

    long countByActiveTrue();

    long countByActiveTrueAndStockQuantityLessThanEqual(int stockQuantity);

    Optional<Product> findBySku(String sku);

    Optional<Product> findBySlug(String slug);

    boolean existsBySku(String sku);

    boolean existsBySlug(String slug);

    List<Product> findByCategoryIdAndActiveTrue(Long categoryId);

    @Query(
            value = "SELECT p FROM Product p LEFT JOIN FETCH p.category c WHERE p.active = true",
            countQuery = "SELECT COUNT(p) FROM Product p WHERE p.active = true")
    Page<Product> findAllActiveWithCategory(Pageable pageable);

    // =========================================================================
    // CUSTOM QUERIES: Tìm kiếm sản phẩm điện tử theo tên và lọc theo khoảng giá
    // =========================================================================

    /**
     * Custom Query 1 (JPQL): Tìm kiếm các sản phẩm thuộc danh mục "Điện tử" (Electronics)
     * theo từ khóa tên và khoảng giá (minPrice đến maxPrice), chỉ lấy sản phẩm đang active.
     */
    @Query("SELECT p FROM Product p " +
           "JOIN p.category c " +
           "WHERE p.active = true " +
           "AND (LOWER(c.slug) IN ('dien-tu', 'electronics') OR LOWER(c.name) LIKE '%điện tử%' OR LOWER(c.name) LIKE '%electronics%') " +
           "AND LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "AND p.price BETWEEN :minPrice AND :maxPrice " +
           "ORDER BY p.price ASC")
    List<Product> searchElectronicProductsByNameAndPriceRange(
            @Param("keyword") String keyword,
            @Param("minPrice") BigDecimal minPrice,
            @Param("maxPrice") BigDecimal maxPrice);

    /**
     * Custom Query 2 (JPQL có phân trang & giá trị tùy chọn):
     * Tìm kiếm sản phẩm theo tên danh mục, thương hiệu (brand), từ khóa tên sản phẩm
     * và khoảng giá linh hoạt (minPrice/maxPrice có thể null).
     */
    @Query("SELECT p FROM Product p " +
           "LEFT JOIN p.category c " +
           "LEFT JOIN c.parentCategory parent " +
           "WHERE p.active = true " +
           "AND (:categoryId IS NULL OR c.id = :categoryId OR parent.id = :categoryId) " +
           "AND (:categoryName = '' OR LOWER(c.name) LIKE LOWER(CONCAT('%', :categoryName, '%'))) " +
           "AND (:brand = '' OR LOWER(p.brand) LIKE LOWER(CONCAT('%', :brand, '%'))) " +
           "AND (:keyword = '' OR LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
           "AND (:minPrice IS NULL OR p.price >= :minPrice) " +
           "AND (:maxPrice IS NULL OR p.price <= :maxPrice)")
    Page<Product> searchByCategoryAndBrandAndNameAndPriceRange(
            @Param("categoryId") Long categoryId,
            @Param("categoryName") String categoryName,
            @Param("brand") String brand,
            @Param("keyword") String keyword,
            @Param("minPrice") BigDecimal minPrice,
            @Param("maxPrice") BigDecimal maxPrice,
            Pageable pageable);

    @Query("SELECT p FROM Product p " +
           "JOIN p.category c " +
           "WHERE p.active = true " +
           "AND LOWER(c.name) LIKE LOWER(CONCAT('%', :categoryName, '%')) " +
           "AND LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "AND (:minPrice IS NULL OR p.price >= :minPrice) " +
           "AND (:maxPrice IS NULL OR p.price <= :maxPrice)")
    Page<Product> searchByCategoryAndNameAndPriceRange(
            @Param("categoryName") String categoryName,
            @Param("keyword") String keyword,
            @Param("minPrice") BigDecimal minPrice,
            @Param("maxPrice") BigDecimal maxPrice,
            Pageable pageable);

    /**
     * Custom Query 3 (Derived Query Method):
     * Sử dụng quy tắc đặt tên phương thức của Spring Data JPA để tự sinh truy vấn
     * lọc theo tên danh mục, tên sản phẩm chứa từ khóa (không phân biệt hoa thường)
     * và khoảng giá.
     */
    List<Product> findByCategory_NameContainingIgnoreCaseAndNameContainingIgnoreCaseAndPriceBetweenAndActiveTrue(
            String categoryName,
            String productName,
            BigDecimal minPrice,
            BigDecimal maxPrice);

    /**
     * Custom Query 4 (Native SQL Query):
     * Truy vấn trực tiếp bằng cú pháp SQL tối ưu hóa index trên SQL Server,
     * join giữa bảng Products và Categories để lọc sản phẩm điện tử theo tên và giá.
     */
    @Query(value = "SELECT p.* FROM Products p " +
                   "INNER JOIN Categories c ON p.CategoryId = c.CategoryId " +
                   "WHERE p.IsActive = 1 " +
                   "AND (c.Slug IN ('dien-tu', 'electronics') OR c.Name LIKE N'%Điện tử%' OR c.Name LIKE '%Electronics%') " +
                   "AND LOWER(p.Name) LIKE LOWER(CONCAT('%', :name, '%')) " +
                   "AND p.Price >= :minPrice AND p.Price <= :maxPrice " +
                   "ORDER BY p.Price ASC",
           nativeQuery = true)
    List<Product> searchElectronicProductsNative(
            @Param("name") String name,
            @Param("minPrice") BigDecimal minPrice,
            @Param("maxPrice") BigDecimal maxPrice);
}
