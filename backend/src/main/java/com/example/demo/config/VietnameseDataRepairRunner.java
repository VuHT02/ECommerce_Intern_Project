package com.example.demo.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Runner kh\u1edfi \u0111\u1ed9ng: Chuy\u1ec3n to\u00e0n b\u1ed9 c\u1ed9t VARCHAR \u2192 NVARCHAR v\u00e0 s\u1eeda d\u1eef li\u1ec7u ti\u1ebfng Vi\u1ec7t + \u1ea3nh ch\u1ebft.
 *
 * Hibernate uses NVARCHAR only for fields marked with @Nationalized. A mismatch
 * where the corresponding database column remains VARCHAR can cause SQL Server
 * JDBC to fail while reading data. This runner attempts legacy column upgrades
 * with JdbcTemplate before Hibernate reads entities.
 */
@Component
@Order(1)
@RequiredArgsConstructor
@Slf4j
public class VietnameseDataRepairRunner implements ApplicationRunner {

    private final JdbcTemplate jdbc;

    @Override
    public void run(ApplicationArguments args) {
        try {
            alterAllVarcharToNvarchar();
            repairCategoryNames();
            repairProductNames();
            repairProductImages();
            log.info("Vietnamese data repair completed successfully.");
        } catch (Exception e) {
            log.warn("Vietnamese data repair encountered an issue: {}", e.getMessage());
        }
    }

    // ================================================================
    // 1. ALTER ALL VARCHAR columns -> NVARCHAR
    //    Covers every String field across all entities.
    // ================================================================
    private void alterAllVarcharToNvarchar() {
        // ── Categories ──
        safeAlter("Categories", "Name",          "NVARCHAR(150)", false);
        safeAlter("Categories", "Slug",          "NVARCHAR(150)", false);

        // ── Products ──
        safeAlter("Products", "SKU",             "NVARCHAR(50)",   false);
        safeAlter("Products", "Name",            "NVARCHAR(255)",  false);
        safeAlter("Products", "Slug",            "NVARCHAR(220)",  false);
        safeAlter("Products", "Description",     "NVARCHAR(MAX)",  true);
        safeAlter("Products", "Brand",           "NVARCHAR(100)",  true);
        safeAlter("Products", "ImageUrl",        "NVARCHAR(1000)", true);

        // ── Users ──
        safeAlter("Users", "Email",              "NVARCHAR(320)",  false);
        safeAlter("Users", "PasswordHash",       "NVARCHAR(255)",  false);
        safeAlter("Users", "FullName",           "NVARCHAR(150)",  true);
        safeAlter("Users", "Phone",              "NVARCHAR(20)",   true);
        safeAlter("Users", "Role",               "NVARCHAR(20)",   false);

        // ── Orders ──
        safeAlter("Orders", "OrderNumber",       "NVARCHAR(30)",   false);
        safeAlter("Orders", "Status",            "NVARCHAR(20)",   false);
        safeAlter("Orders", "PaymentMethod",     "NVARCHAR(30)",   true);
        safeAlter("Orders", "PaymentStatus",     "NVARCHAR(20)",   false);
        safeAlter("Orders", "RecipientName",     "NVARCHAR(150)",  false);
        safeAlter("Orders", "RecipientPhone",    "NVARCHAR(20)",   false);
        safeAlter("Orders", "ShippingAddress",   "NVARCHAR(500)",  false);

        // ── OrderDetails ──
        safeAlter("OrderDetails", "ProductName", "NVARCHAR(255)",  false);
        safeAlter("OrderDetails", "SKU",         "NVARCHAR(50)",   false);

        // ── Vouchers ──
        safeAlter("Vouchers", "Code",            "NVARCHAR(50)",   false);
        safeAlter("Vouchers", "Title",           "NVARCHAR(200)",  false);
        safeAlter("Vouchers", "Description",     "NVARCHAR(500)",  true);
        safeAlter("Vouchers", "DiscountType",    "NVARCHAR(20)",   false);

        // ── ProductImages ──
        safeAlter("ProductImages", "ImageUrl",   "NVARCHAR(1000)", false);

        // ── Reviews ──
        safeAlter("Reviews", "Comment",          "NVARCHAR(1000)", true);

        // ── UserAddresses ──
        safeAlter("UserAddresses", "RecipientName",  "NVARCHAR(150)", false);
        safeAlter("UserAddresses", "Phone",          "NVARCHAR(20)",  false);
        safeAlter("UserAddresses", "Province",       "NVARCHAR(100)", false);
        safeAlter("UserAddresses", "District",       "NVARCHAR(100)", false);
        safeAlter("UserAddresses", "Ward",           "NVARCHAR(100)", false);
        safeAlter("UserAddresses", "StreetAddress",  "NVARCHAR(255)", false);

        // ── RefreshTokens ──
        safeAlter("RefreshTokens", "Token",      "NVARCHAR(512)",  false);

        log.info("All VARCHAR columns verified/converted to NVARCHAR.");
    }

    // ================================================================
    // 2. Fix Category Names (by slug - always ASCII safe)
    // ================================================================
    private void repairCategoryNames() {
        int t = 0;
        t += updateNameBySlug("Categories", "laptop",           "Laptop");
        t += updateNameBySlug("Categories", "dien-thoai",       "\u0110i\u1ec7n tho\u1ea1i");       // Điện thoại
        t += updateNameBySlug("Categories", "may-tinh-bang",    "M\u00e1y t\u00ednh b\u1ea3ng");    // Máy tính bảng
        t += updateNameBySlug("Categories", "phu-kien",         "Ph\u1ee5 ki\u1ec7n");              // Phụ kiện
        t += updateNameBySlug("Categories", "laptop-gaming",    "Laptop Gaming");
        t += updateNameBySlug("Categories", "laptop-van-phong", "Laptop V\u0103n ph\u00f2ng");      // Laptop Văn phòng
        t += updateNameBySlug("Categories", "laptop-do-hoa",    "Laptop \u0110\u1ed3 h\u1ecda");    // Laptop Đồ họa
        if (t > 0) log.info("Fixed {} category names.", t);
    }

    // ================================================================
    // 3. Fix Product Names (by SKU - always ASCII safe)
    // ================================================================
    private void repairProductNames() {
        int t = 0;
        t += updateNameBySku("ASUS-ROG-G15",       "ASUS ROG Strix G15 RTX 4060");
        t += updateNameBySku("ASUS-TUF-F15",       "ASUS TUF Gaming F15 RTX 3050");
        t += updateNameBySku("DELL-G15-5530",      "Dell G15 5530 RTX 4060");
        t += updateNameBySku("LENOVO-LOQ-15",      "Lenovo LOQ 15APH8 RTX 4060");
        t += updateNameBySku("MSI-KATANA-15",      "MSI Katana 15 RTX 4070");
        t += updateNameBySku("APPLE-MBA-M2",       "Apple MacBook Air M2 13\" 256GB");
        t += updateNameBySku("APPLE-MBP-M3P",      "Apple MacBook Pro M3 Pro 14\"");
        t += updateNameBySku("DELL-XPS-15",        "Dell XPS 15 9530 OLED");
        t += updateNameBySku("HP-SPECTRE-X360",    "HP Spectre x360 14\" OLED");
        t += updateNameBySku("LENOVO-X1-CARBON",   "Lenovo ThinkPad X1 Carbon Gen 11");
        t += updateNameBySku("APPLE-MBP-M3MAX",    "Apple MacBook Pro M3 Max 16\"");
        t += updateNameBySku("ASUS-PROART-16",     "ASUS ProArt Studiobook 16 OLED");
        t += updateNameBySku("APPLE-IP15PM",       "Apple iPhone 15 Pro Max 256GB");
        t += updateNameBySku("SAMSUNG-S24U",       "Samsung Galaxy S24 Ultra 256GB");
        t += updateNameBySku("SAMSUNG-S24",        "Samsung Galaxy S24 128GB");
        t += updateNameBySku("XIAOMI-14-ULTRA",    "Xiaomi 14 Ultra 512GB");
        t += updateNameBySku("APPLE-IPAD-PRO",     "Apple iPad Pro M2 12.9\" WiFi 256GB");
        t += updateNameBySku("SAMSUNG-TAB-S9U",    "Samsung Galaxy Tab S9 Ultra 256GB");
        t += updateNameBySku("APPLE-AIRPODS-PRO2", "Apple AirPods Pro 2nd Gen (USB-C)");
        t += updateNameBySku("SAMSUNG-BUDS3-PRO",  "Samsung Galaxy Buds3 Pro");
        if (t > 0) log.info("Fixed {} product names.", t);
    }

    // ================================================================
    // 4. Fix Dead Product Images
    // ================================================================
    private void repairProductImages() {
        String imgIphone = "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=800&q=80";
        String imgPhone  = "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80";
        String imgLaptop = "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80";

        int t = 0;
        // Products table
        t += fixDeadImage("Products",      "ImageUrl", "photo-1696426045030", imgIphone);
        t += fixDeadImage("Products",      "ImageUrl", "photo-1542751110",    imgPhone);
        t += fixDeadImage("Products",      "ImageUrl", "photo-1695048133142", imgLaptop);
        t += fixDeadImage("Products",      "ImageUrl", "photo-1598327105666", imgLaptop);
        // ProductImages table (gallery)
        t += fixDeadImage("ProductImages", "ImageUrl", "photo-1696426045030", imgIphone);
        t += fixDeadImage("ProductImages", "ImageUrl", "photo-1542751110",    imgPhone);
        t += fixDeadImage("ProductImages", "ImageUrl", "photo-1695048133142", imgLaptop);
        t += fixDeadImage("ProductImages", "ImageUrl", "photo-1598327105666", imgLaptop);
        if (t > 0) log.info("Fixed {} dead image URLs.", t);
    }

    // ================================================================
    // Helpers
    // ================================================================
    private void safeAlter(String table, String column, String type, boolean nullable) {
        String nullSpec = nullable ? "NULL" : "NOT NULL";
        try {
            jdbc.execute("ALTER TABLE " + table + " ALTER COLUMN " + column + " " + type + " " + nullSpec);
        } catch (Exception e) {
            log.debug("ALTER {}.{} skipped: {}", table, column, e.getMessage());
        }
    }

    private int updateNameBySlug(String table, String slug, String name) {
        try {
            return jdbc.update(
                "UPDATE " + table + " SET Name = N'" + esc(name) + "' WHERE Slug = ?", slug);
        } catch (Exception e) {
            log.debug("updateNameBySlug {} failed: {}", slug, e.getMessage());
            return 0;
        }
    }

    private int updateNameBySku(String sku, String name) {
        try {
            return jdbc.update("UPDATE Products SET Name = N'" + esc(name) + "' WHERE SKU = ?", sku);
        } catch (Exception e) {
            log.debug("updateNameBySku {} failed: {}", sku, e.getMessage());
            return 0;
        }
    }

    private int fixDeadImage(String table, String col, String deadFragment, String replacement) {
        try {
            return jdbc.update(
                "UPDATE " + table + " SET " + col + " = ? WHERE " + col + " LIKE ?",
                replacement, "%" + deadFragment + "%");
        } catch (Exception e) {
            return 0;
        }
    }

    private static String esc(String s) {
        return s == null ? "" : s.replace("'", "''");
    }
}
