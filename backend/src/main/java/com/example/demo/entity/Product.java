package com.example.demo.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.Generated;
import org.hibernate.annotations.Nationalized;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.generator.EventType;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(
    name = "Products",
    indexes = @Index(name = "IX_Products_CategoryId_IsActive", columnList = "CategoryId, IsActive")
)
@Getter
@Setter
@NoArgsConstructor
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ProductId")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "CategoryId", nullable = false)
    private Category category;

    @Column(name = "SKU", nullable = false, unique = true, length = 50)
    private String sku;

    @Nationalized
    @Column(name = "Name", nullable = false, length = 200)
    private String name;

    @Column(name = "Slug", nullable = false, unique = true, length = 220)
    private String slug;

    @Nationalized
    @Column(name = "Description", columnDefinition = "nvarchar(max)")
    private String description;

    @Nationalized
    @Column(name = "Brand", length = 100)
    private String brand;

    @Column(name = "Price", nullable = false, precision = 18, scale = 2)
    private BigDecimal price;

    @Column(name = "StockQuantity", nullable = false)
    private int stockQuantity;

    @Column(name = "ImageUrl", length = 1000)
    private String imageUrl;

    @Column(name = "IsActive", nullable = false)
    private boolean active = true;

    @CreationTimestamp
    @Column(name = "CreatedAt", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "UpdatedAt")
    private LocalDateTime updatedAt;

    @Version
    @Generated(event = {EventType.INSERT, EventType.UPDATE})
    @Column(name = "RowVersion", columnDefinition = "rowversion", insertable = false, updatable = false)
    private byte[] rowVersion;

    @OneToMany(mappedBy = "product")
    private List<OrderItem> orderItems = new ArrayList<>();

    @OneToMany(mappedBy = "product", cascade = jakarta.persistence.CascadeType.ALL, orphanRemoval = true)
    private List<ProductImage> images = new ArrayList<>();

    @OneToMany(mappedBy = "product")
    private List<Review> reviews = new ArrayList<>();
}
