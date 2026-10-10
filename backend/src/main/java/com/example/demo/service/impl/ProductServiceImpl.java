package com.example.demo.service.impl;

import com.example.demo.dto.ProductRequest;
import com.example.demo.dto.ProductResponse;
import com.example.demo.entity.Category;
import com.example.demo.entity.Product;
import com.example.demo.entity.ProductImage;
import com.example.demo.exception.BadRequestException;
import com.example.demo.exception.ProductNotFoundException;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.repository.CategoryRepository;
import com.example.demo.repository.ProductImageRepository;
import com.example.demo.repository.ProductRepository;
import com.example.demo.service.ProductService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.text.Normalizer;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final ProductImageRepository productImageRepository;
    private final ObjectMapper objectMapper;

    private static final Pattern NONLATIN = Pattern.compile("[^\\w-]");
    private static final Pattern WHITESPACE = Pattern.compile("[\\s]");

    @Override
    @Transactional(readOnly = true)
    public Page<ProductResponse> getAllProducts(Pageable pageable) {
        return productRepository.findAllActiveWithCategory(pageable).map(this::mapToResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ProductResponse> getAdminProducts(String keyword, Long categoryId, Boolean active, Boolean lowStock, Pageable pageable) {
        Specification<Product> specification = (root, query, cb) -> cb.conjunction();
        if (keyword != null && !keyword.isBlank()) {
            String term = "%" + keyword.trim().toLowerCase(Locale.ROOT) + "%";
            specification = specification.and((root, query, cb) -> cb.or(
                    cb.like(cb.lower(root.get("name")), term),
                    cb.like(cb.lower(root.get("sku")), term),
                    cb.like(cb.lower(root.get("brand")), term)));
        }
        if (categoryId != null) {
            specification = specification.and((root, query, cb) -> cb.equal(root.get("category").get("id"), categoryId));
        }
        if (active != null) {
            specification = specification.and((root, query, cb) -> cb.equal(root.get("active"), active));
        }
        if (Boolean.TRUE.equals(lowStock)) {
            specification = specification.and((root, query, cb) -> cb.lessThanOrEqualTo(root.get("stockQuantity"), 5));
        }
        return productRepository.findAll(specification, pageable).map(this::mapToResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public ProductResponse getProductById(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ProductNotFoundException(id));
        return mapToResponse(product);
    }

    @Override
    @Transactional(readOnly = true)
    public ProductResponse getProductBySlug(String slug) {
        Product product = productRepository.findBySlug(slug)
                .orElseThrow(() -> new ProductNotFoundException("slug: " + slug));
        return mapToResponse(product);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ProductResponse> searchProducts(Long categoryId, String categoryName, String keyword, String brand, BigDecimal minPrice, BigDecimal maxPrice, Pageable pageable) {
        String catParam = (categoryName != null && !categoryName.trim().isEmpty()) ? categoryName.trim() : "";
        String kwParam = (keyword != null && !keyword.trim().isEmpty()) ? keyword.trim() : "";
        String brandParam = (brand != null && !brand.trim().isEmpty()) ? brand.trim() : "";

        return productRepository.searchByCategoryAndBrandAndNameAndPriceRange(categoryId, catParam, brandParam, kwParam, minPrice, maxPrice, pageable)
                .map(this::mapToResponse);
    }

    @Override
    @Transactional
    public ProductResponse createProduct(ProductRequest request) {
        if (productRepository.existsBySku(request.getSku())) {
            throw new BadRequestException("Mã SKU '" + request.getSku() + "' đã tồn tại trong hệ thống!");
        }

        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy danh mục với ID: " + request.getCategoryId()));

        String slug = (request.getSlug() != null && !request.getSlug().trim().isEmpty())
                ? toSlug(request.getSlug())
                : toSlug(request.getName());

        if (productRepository.existsBySlug(slug)) {
            slug = slug + "-" + System.currentTimeMillis();
        }

        Product product = new Product();
        product.setCategory(category);
        product.setSku(request.getSku());
        product.setName(request.getName());
        product.setSlug(slug);
        product.setDescription(request.getDescription());
        product.setBrand(request.getBrand());
        product.setPrice(request.getPrice());
        product.setStockQuantity(request.getStockQuantity());
        product.setImageUrl(request.getImageUrl());
        product.setActive(request.isActive());
        product.setSpecificationsJson(serializeSpecifications(request.getSpecifications()));

        Product savedProduct = productRepository.save(product);

        // Lưu thư viện ảnh chi tiết (nếu có)
        if (request.getDetailImageUrls() != null && !request.getDetailImageUrls().isEmpty()) {
            List<ProductImage> images = buildDetailImages(savedProduct, request.getDetailImageUrls());
            productImageRepository.saveAll(images);
            savedProduct.setImages(images);
        }

        return mapToResponse(savedProduct);
    }

    @Override
    @Transactional
    public ProductResponse updateProduct(Long id, ProductRequest request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm với ID: " + id));

        if (!product.getSku().equalsIgnoreCase(request.getSku()) && productRepository.existsBySku(request.getSku())) {
            throw new BadRequestException("Mã SKU '" + request.getSku() + "' đã được sử dụng bởi sản phẩm khác!");
        }

        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy danh mục với ID: " + request.getCategoryId()));

        product.setCategory(category);
        product.setSku(request.getSku());
        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setBrand(request.getBrand());
        product.setPrice(request.getPrice());
        product.setStockQuantity(request.getStockQuantity());
        product.setImageUrl(request.getImageUrl());
        product.setActive(request.isActive());
        product.setSpecificationsJson(serializeSpecifications(request.getSpecifications()));
        String requestedSlug = (request.getSlug() != null && !request.getSlug().isBlank())
                ? toSlug(request.getSlug()) : toSlug(request.getName());
        if (!product.getSlug().equals(requestedSlug) && productRepository.existsBySlug(requestedSlug)) {
            requestedSlug = requestedSlug + "-" + product.getId();
        }
        product.setSlug(requestedSlug);

        if (request.getDetailImageUrls() != null) {
            product.getImages().clear();
            if (!request.getDetailImageUrls().isEmpty()) {
                product.getImages().addAll(buildDetailImages(product, request.getDetailImageUrls()));
            }
        }

        Product updatedProduct = productRepository.save(product);
        return mapToResponse(updatedProduct);
    }

    @Override
    @Transactional
    public void deleteProduct(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm với ID: " + id));
        // Soft delete an toàn: không làm mất toàn vẹn khoá ngoại của đơn hàng cũ
        product.setActive(false);
        productRepository.save(product);
    }

    @Override
    @Transactional
    public void updateStock(Long id, int quantityDelta) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm với ID: " + id));
        int newStock = product.getStockQuantity() + quantityDelta;
        if (newStock < 0) {
            throw new BadRequestException("Số lượng tồn kho không đủ để thực hiện thao tác!");
        }
        product.setStockQuantity(newStock);
        productRepository.save(product);
    }

    private ProductResponse mapToResponse(Product product) {
        List<String> detailImages = new ArrayList<>();
        if (product.getImages() != null) {
            for (ProductImage img : product.getImages()) {
                detailImages.add(img.getImageUrl());
            }
        }

        return ProductResponse.builder()
                .id(product.getId())
                .categoryId(product.getCategory() != null ? product.getCategory().getId() : null)
                .categoryName(product.getCategory() != null ? product.getCategory().getName() : null)
                .sku(product.getSku())
                .name(product.getName())
                .slug(product.getSlug())
                .description(product.getDescription())
                .brand(product.getBrand())
                .price(product.getPrice())
                .stockQuantity(product.getStockQuantity())
                .imageUrl(product.getImageUrl())
                .specifications(deserializeSpecifications(product.getSpecificationsJson()))
                .active(product.isActive())
                .detailImageUrls(detailImages)
                .createdAt(product.getCreatedAt())
                .updatedAt(product.getUpdatedAt())
                .build();
    }

    private List<ProductImage> buildDetailImages(Product product, List<String> imageUrls) {
        List<ProductImage> images = new ArrayList<>();
        int order = 1;
        for (String imageUrl : imageUrls) {
            if (imageUrl == null || imageUrl.isBlank()) continue;
            ProductImage image = new ProductImage();
            image.setProduct(product);
            image.setImageUrl(imageUrl.trim());
            image.setDisplayOrder(order++);
            image.setThumbnail(false);
            images.add(image);
        }
        return images;
    }

    private String serializeSpecifications(Map<String, String> specifications) {
        if (specifications == null || specifications.isEmpty()) return null;
        Map<String, String> cleaned = new LinkedHashMap<>();
        specifications.forEach((key, value) -> {
            if (key != null && !key.isBlank() && value != null && !value.isBlank()) {
                cleaned.put(key.trim(), value.trim());
            }
        });
        if (cleaned.isEmpty()) return null;
        try {
            return objectMapper.writeValueAsString(cleaned);
        } catch (JsonProcessingException exception) {
            throw new BadRequestException("Không thể lưu thông số kỹ thuật sản phẩm.");
        }
    }

    private Map<String, String> deserializeSpecifications(String json) {
        if (json == null || json.isBlank()) return Map.of();
        try {
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (JsonProcessingException exception) {
            return Map.of();
        }
    }

    private String toSlug(String input) {
        if (input == null) return "";
        String nowhitespace = WHITESPACE.matcher(input).replaceAll("-");
        String normalized = Normalizer.normalize(nowhitespace, Normalizer.Form.NFD);
        String slug = NONLATIN.matcher(normalized).replaceAll("");
        return slug.toLowerCase(Locale.ENGLISH).replaceAll("-+", "-");
    }
}
