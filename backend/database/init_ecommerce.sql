-- ==========================================================================================
-- HỆ THỐNG CƠ SỞ DỮ LIỆU THƯƠNG MẠI ĐIỆN TỬ (E-COMMERCE DATABASE)
-- Hệ quản trị CSDL: Microsoft SQL Server 2019+
-- Tương thích 100% với Spring Boot 4 / Hibernate Entities của Project
-- ==========================================================================================

-- 1. TẠO DATABASE (NẾU CHƯA CÓ)
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'ecommerce')
BEGIN
    CREATE DATABASE ecommerce COLLATE Vietnamese_CI_AS;
END
GO

USE ecommerce;
GO

-- 2. XÓA CÁC BẢNG THEO THỨ TỰ RÀNG BUỘC KHÓA NGOẠI (NẾU CẦN RESET)
IF OBJECT_ID('dbo.Reviews', 'U') IS NOT NULL DROP TABLE dbo.Reviews;
IF OBJECT_ID('dbo.OrderDetails', 'U') IS NOT NULL DROP TABLE dbo.OrderDetails;
IF OBJECT_ID('dbo.Orders', 'U') IS NOT NULL DROP TABLE dbo.Orders;
IF OBJECT_ID('dbo.CartItems', 'U') IS NOT NULL DROP TABLE dbo.CartItems;
IF OBJECT_ID('dbo.Carts', 'U') IS NOT NULL DROP TABLE dbo.Carts;
IF OBJECT_ID('dbo.UserAddresses', 'U') IS NOT NULL DROP TABLE dbo.UserAddresses;
IF OBJECT_ID('dbo.ProductImages', 'U') IS NOT NULL DROP TABLE dbo.ProductImages;
IF OBJECT_ID('dbo.Products', 'U') IS NOT NULL DROP TABLE dbo.Products;
IF OBJECT_ID('dbo.Categories', 'U') IS NOT NULL DROP TABLE dbo.Categories;
IF OBJECT_ID('dbo.Vouchers', 'U') IS NOT NULL DROP TABLE dbo.Vouchers;
IF OBJECT_ID('dbo.RefreshTokens', 'U') IS NOT NULL DROP TABLE dbo.RefreshTokens;
IF OBJECT_ID('dbo.Users', 'U') IS NOT NULL DROP TABLE dbo.Users;
GO

-- ==========================================================================================
-- 3. TẠO CÁC BẢNG (TABLES KHỚP 100% CÁC ENTITY TRONG JAVA)
-- ==========================================================================================

-- [Bảng 1]: Users - Người dùng hệ thống (Admin, Khách hàng)
CREATE TABLE dbo.Users (
    UserId BIGINT IDENTITY(1,1) PRIMARY KEY,
    Email NVARCHAR(320) NOT NULL UNIQUE,
    PasswordHash NVARCHAR(255) NOT NULL,
    FullName NVARCHAR(150) NULL,
    Phone NVARCHAR(20) NULL,
    Role NVARCHAR(20) NOT NULL DEFAULT 'CUSTOMER', -- 'CUSTOMER', 'ADMIN', 'STAFF'
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2 NULL
);
GO

-- [Bảng 1B]: RefreshTokens - Lưu trữ token làm mới phiên đăng nhập (Quan hệ 1-1 với User)
CREATE TABLE dbo.RefreshTokens (
    RefreshTokenId BIGINT IDENTITY(1,1) PRIMARY KEY,
    UserId BIGINT NOT NULL UNIQUE,
    Token NVARCHAR(512) NOT NULL UNIQUE,
    ExpiryDate DATETIMEOFFSET NOT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_RefreshTokens_User FOREIGN KEY (UserId) REFERENCES dbo.Users(UserId) ON DELETE CASCADE
);
GO

-- [Bảng 2]: Categories - Danh mục sản phẩm (Hỗ trợ danh mục đa cấp: Cha - Con)
CREATE TABLE dbo.Categories (
    CategoryId BIGINT IDENTITY(1,1) PRIMARY KEY,
    ParentCategoryId BIGINT NULL,
    Name NVARCHAR(120) NOT NULL,
    Slug VARCHAR(150) NOT NULL UNIQUE,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_Categories_Parent FOREIGN KEY (ParentCategoryId) REFERENCES dbo.Categories(CategoryId)
);
GO

-- [Bảng 3]: Products - Sản phẩm (Có RowVersion hỗ trợ Optimistic Locking)
CREATE TABLE dbo.Products (
    ProductId BIGINT IDENTITY(1,1) PRIMARY KEY,
    CategoryId BIGINT NOT NULL,
    SKU VARCHAR(50) NOT NULL UNIQUE,
    Name NVARCHAR(200) NOT NULL,
    Slug VARCHAR(220) NOT NULL UNIQUE,
    Description NVARCHAR(MAX) NULL,
    Brand NVARCHAR(100) NULL,
    Price DECIMAL(18,2) NOT NULL,
    StockQuantity INT NOT NULL DEFAULT 0,
    ImageUrl NVARCHAR(1000) NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2 NULL,
    RowVersion ROWVERSION NOT NULL,
    CONSTRAINT FK_Products_Category FOREIGN KEY (CategoryId) REFERENCES dbo.Categories(CategoryId)
);
GO

-- Index tăng tốc tìm kiếm sản phẩm theo danh mục và trạng thái
CREATE NONCLUSTERED INDEX IX_Products_CategoryId_IsActive 
ON dbo.Products (CategoryId, IsActive);
GO

-- [Bảng 4]: ProductImages - Bộ sưu tập nhiều ảnh chi tiết của sản phẩm
CREATE TABLE dbo.ProductImages (
    ProductImageId BIGINT IDENTITY(1,1) PRIMARY KEY,
    ProductId BIGINT NOT NULL,
    ImageUrl NVARCHAR(1000) NOT NULL,
    DisplayOrder INT NOT NULL DEFAULT 0,
    IsThumbnail BIT NOT NULL DEFAULT 0,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_ProductImages_Product FOREIGN KEY (ProductId) REFERENCES dbo.Products(ProductId) ON DELETE CASCADE
);
GO

-- [Bảng 5]: Vouchers - Mã giảm giá / Khuyến mãi (Có RowVersion chống Race Condition)
CREATE TABLE dbo.Vouchers (
    VoucherId BIGINT IDENTITY(1,1) PRIMARY KEY,
    Code VARCHAR(50) NOT NULL UNIQUE,
    Title NVARCHAR(200) NOT NULL,
    Description NVARCHAR(500) NULL,
    DiscountType VARCHAR(20) NOT NULL, -- 'PERCENTAGE', 'FIXED_AMOUNT'
    DiscountValue DECIMAL(18,2) NOT NULL,
    MinOrderValue DECIMAL(18,2) NULL,
    MaxDiscountAmount DECIMAL(18,2) NULL,
    UsageLimit INT NULL,
    UsedCount INT NOT NULL DEFAULT 0,
    StartDate DATETIME2 NOT NULL,
    EndDate DATETIME2 NOT NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    RowVersion ROWVERSION NOT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2 NULL
);
GO

CREATE NONCLUSTERED INDEX IX_Vouchers_Code 
ON dbo.Vouchers (Code);
GO

-- [Bảng 6]: UserAddresses - Sổ địa chỉ giao hàng của người dùng
CREATE TABLE dbo.UserAddresses (
    UserAddressId BIGINT IDENTITY(1,1) PRIMARY KEY,
    UserId BIGINT NOT NULL,
    RecipientName NVARCHAR(150) NOT NULL,
    Phone NVARCHAR(20) NOT NULL,
    Province NVARCHAR(100) NOT NULL,
    District NVARCHAR(100) NOT NULL,
    Ward NVARCHAR(100) NOT NULL,
    StreetAddress NVARCHAR(255) NOT NULL,
    IsDefault BIT NOT NULL DEFAULT 0,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2 NULL,
    CONSTRAINT FK_UserAddresses_User FOREIGN KEY (UserId) REFERENCES dbo.Users(UserId) ON DELETE CASCADE
);
GO

CREATE NONCLUSTERED INDEX IX_UserAddresses_UserId 
ON dbo.UserAddresses (UserId);
GO

-- [Bảng 7]: Carts - Giỏ hàng người dùng (Quan hệ 1-1 với Users)
CREATE TABLE dbo.Carts (
    CartId BIGINT IDENTITY(1,1) PRIMARY KEY,
    UserId BIGINT NOT NULL UNIQUE,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2 NULL,
    CONSTRAINT FK_Carts_User FOREIGN KEY (UserId) REFERENCES dbo.Users(UserId) ON DELETE CASCADE
);
GO

-- [Bảng 8]: CartItems - Chi tiết các sản phẩm trong giỏ
CREATE TABLE dbo.CartItems (
    CartItemId BIGINT IDENTITY(1,1) PRIMARY KEY,
    CartId BIGINT NOT NULL,
    ProductId BIGINT NOT NULL,
    Quantity INT NOT NULL DEFAULT 1,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2 NULL,
    CONSTRAINT FK_CartItems_Cart FOREIGN KEY (CartId) REFERENCES dbo.Carts(CartId) ON DELETE CASCADE,
    CONSTRAINT FK_CartItems_Product FOREIGN KEY (ProductId) REFERENCES dbo.Products(ProductId),
    CONSTRAINT UQ_CartItems_CartId_ProductId UNIQUE (CartId, ProductId)
);
GO

-- [Bảng 9]: Orders - Đơn đặt hàng
CREATE TABLE dbo.Orders (
    OrderId BIGINT IDENTITY(1,1) PRIMARY KEY,
    UserId BIGINT NOT NULL,
    OrderNumber VARCHAR(30) NOT NULL UNIQUE,
    Status VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- PENDING, CONFIRMED, SHIPPING, DELIVERED, CANCELLED
    PaymentMethod VARCHAR(30) NULL, -- COD, VNPAY, MOMO, BANKING
    PaymentStatus VARCHAR(20) NOT NULL DEFAULT 'UNPAID', -- UNPAID, PAID, REFUNDED
    Subtotal DECIMAL(18,2) NOT NULL,
    ShippingFee DECIMAL(18,2) NOT NULL DEFAULT 0,
    DiscountAmount DECIMAL(18,2) NOT NULL DEFAULT 0,
    VoucherId BIGINT NULL,
    TotalAmount DECIMAL(18,2) NOT NULL,
    RecipientName NVARCHAR(150) NOT NULL,
    RecipientPhone NVARCHAR(20) NOT NULL,
    ShippingAddress NVARCHAR(500) NOT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2 NULL,
    CONSTRAINT FK_Orders_User FOREIGN KEY (UserId) REFERENCES dbo.Users(UserId),
    CONSTRAINT FK_Orders_Voucher FOREIGN KEY (VoucherId) REFERENCES dbo.Vouchers(VoucherId)
);
GO

CREATE NONCLUSTERED INDEX IX_Orders_UserId_CreatedAt 
ON dbo.Orders (UserId, CreatedAt);
GO

-- [Bảng 10]: OrderDetails - Chi tiết mặt hàng đã đặt trong đơn
CREATE TABLE dbo.OrderDetails (
    OrderDetailId BIGINT IDENTITY(1,1) PRIMARY KEY,
    OrderId BIGINT NOT NULL,
    ProductId BIGINT NOT NULL,
    ProductName NVARCHAR(200) NOT NULL,
    SKU VARCHAR(50) NOT NULL,
    Quantity INT NOT NULL,
    UnitPrice DECIMAL(18,2) NOT NULL,
    CONSTRAINT FK_OrderDetails_Order FOREIGN KEY (OrderId) REFERENCES dbo.Orders(OrderId) ON DELETE CASCADE,
    CONSTRAINT FK_OrderDetails_Product FOREIGN KEY (ProductId) REFERENCES dbo.Products(ProductId)
);
GO

-- [Bảng 11]: Reviews - Đánh giá và bình luận sản phẩm
CREATE TABLE dbo.Reviews (
    ReviewId BIGINT IDENTITY(1,1) PRIMARY KEY,
    UserId BIGINT NOT NULL,
    ProductId BIGINT NOT NULL,
    Rating INT NOT NULL CHECK (Rating >= 1 AND Rating <= 5),
    Comment NVARCHAR(1000) NULL,
    IsVerifiedPurchase BIT NOT NULL DEFAULT 0,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2 NULL,
    CONSTRAINT FK_Reviews_User FOREIGN KEY (UserId) REFERENCES dbo.Users(UserId),
    CONSTRAINT FK_Reviews_Product FOREIGN KEY (ProductId) REFERENCES dbo.Products(ProductId) ON DELETE CASCADE
);
GO

CREATE NONCLUSTERED INDEX IX_Reviews_ProductId_CreatedAt 
ON dbo.Reviews (ProductId, CreatedAt);
GO

-- ==========================================================================================
-- 4. INSERT DỮ LIỆU MẪU CHUẨN THỰC TẾ (MÁY TÍNH, ĐIỆN THOẠI, HÌNH ẢNH ĐẦY ĐỦ)
-- ==========================================================================================

-- 4.1. Thêm Users mẫu (Mật khẩu bcrypt mẫu cho 'Password@123')
INSERT INTO dbo.Users (Email, PasswordHash, FullName, Phone, Role, IsActive) VALUES
(N'admin@ecommerce.com', N'$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', N'Quản Trị Viên', N'0901234567', N'ADMIN', 1),
(N'nguyenvana@gmail.com', N'$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', N'Nguyễn Văn A', N'0987654321', N'CUSTOMER', 1),
(N'tranthib@gmail.com', N'$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', N'Trần Thị B', N'0912345678', N'CUSTOMER', 1);
GO

-- 4.2. Thêm Sổ địa chỉ (UserAddresses)
INSERT INTO dbo.UserAddresses (UserId, RecipientName, Phone, Province, District, Ward, StreetAddress, IsDefault) VALUES
(2, N'Nguyễn Văn A', N'0987654321', N'Hà Nội', N'Cầu Giấy', N'Dịch Vọng Hậu', N'Số 18, Phố Duy Tân', 1),
(2, N'Nguyễn Văn A (Nhà riêng)', N'0987654321', N'Hà Nội', N'Đống Đa', N'Láng Thượng', N'Ngõ 1194 Đường Láng', 0),
(3, N'Trần Thị B', N'0912345678', N'TP. Hồ Chí Minh', N'Quận 1', N'Bến Nghé', N'Tầng 12, Toà nhà Bitexco, Số 2 Hải Triều', 1);
GO

-- 4.3. Thêm Danh mục (Categories: Điện tử -> Điện thoại, Laptop, Phụ kiện)
INSERT INTO dbo.Categories (ParentCategoryId, Name, Slug, IsActive) VALUES
(NULL, N'Thiết Bị Điện Tử', 'dien-tu', 1); -- CategoryId = 1

DECLARE @ElectronicsId BIGINT = SCOPE_IDENTITY();

INSERT INTO dbo.Categories (ParentCategoryId, Name, Slug, IsActive) VALUES
(@ElectronicsId, N'Điện Thoại Thông Minh', 'dien-thoai-thong-minh', 1), -- CategoryId = 2
(@ElectronicsId, N'Máy Tính & Laptop', 'may-tinh-laptop', 1),          -- CategoryId = 3
(@ElectronicsId, N'Máy Tính Bảng', 'may-tinh-bang', 1),                -- CategoryId = 4
(@ElectronicsId, N'Phụ Kiện Điện Tử', 'phu-kien-dien-tu', 1);          -- CategoryId = 5
GO

-- 4.4. Thêm Sản phẩm (Products: Máy tính, Điện thoại, Phụ kiện)
-- Danh mục 2: Điện thoại, Danh mục 3: Máy tính & Laptop, Danh mục 5: Phụ kiện
INSERT INTO dbo.Products (CategoryId, SKU, Name, Slug, Description, Brand, Price, StockQuantity, ImageUrl, IsActive) VALUES
-- 1. Điện thoại Apple
(2, 'IPHONE-15-PM-256', N'iPhone 15 Pro Max 256GB Titan Tự Nhiên', 'iphone-15-pro-max-256gb-titan',
 N'Chip Apple A17 Pro mạnh mẽ, khung viền Titan siêu bền nhẹ, hệ thống camera tiềm vọng zoom 5x đỉnh cao.',
 N'Apple', 29490000.00, 45, N'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=800&q=80', 1),

-- 2. Điện thoại Samsung
(2, 'SS-S24-ULTRA-256', N'Samsung Galaxy S24 Ultra 5G 256GB Xám Titan', 'samsung-galaxy-s24-ultra-5g-256gb',
 N'Quyền năng Galaxy AI, Snapdragon 8 Gen 3 for Galaxy, màn hình Dynamic AMOLED 2X 6.8 inch 120Hz chống chói, bút S-Pen tích hợp.',
 N'Samsung', 26990000.00, 30, N'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?auto=format&fit=crop&w=800&q=80', 1),

-- 3. Điện thoại Xiaomi
(2, 'XIAOMI-14-512', N'Xiaomi 14 Ultra 512GB Đen Nhiếp Ảnh Leica', 'xiaomi-14-ultra-512gb-den',
 N'Hệ thống 4 camera cảm biến 1 inch hợp tác Leica, chip Snapdragon 8 Gen 3, màn hình WQHD+ AMOLED siêu sáng.',
 N'Xiaomi', 24490000.00, 20, N'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=800&q=80', 1),

-- 4. Máy tính MacBook
(3, 'MACBOOK-PRO-M3-14', N'MacBook Pro 14 inch M3 Pro (18GB RAM / 512GB SSD)', 'macbook-pro-14-m3-pro-18gb-512gb',
 N'Hiệu năng đồ hoạ đỉnh cao với chip Apple M3 Pro, màn hình Liquid Retina XDR 120Hz sắc nét, thời lượng pin lên đến 18 tiếng.',
 N'Apple', 48990000.00, 25, N'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80', 1),

-- 5. Máy tính Dell XPS
(3, 'DELL-XPS-15-9530', N'Dell XPS 15 9530 Core i7-13700H / 16GB / 512GB / RTX 4050', 'dell-xps-15-9530-core-i7-rtx4050',
 N'Thiết kế nhôm nguyên khối sang trọng, màn hình OLED 3.5K viền siêu mỏng, card đồ hoạ rời RTX 4050 phục vụ đồ hoạ chuyên nghiệp.',
 N'Dell', 42500000.00, 15, N'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=800&q=80', 1),

-- 6. Máy tính Gaming ASUS ROG
(3, 'ASUS-ROG-G16-2024', N'ASUS ROG Zephyrus G16 OLED Core Ultra 9 / 32GB / 1TB / RTX 4070', 'asus-rog-zephyrus-g16-oled-rtx4070',
 N'Laptop gaming mỏng nhẹ cao cấp nhất, màn hình 2.5K OLED 240Hz, card RTX 4070 cân mượt mọi tựa game AAA.',
 N'ASUS', 56990000.00, 12, N'https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=800&q=80', 1),

-- 7. Máy tính ThinkPad doanh nhân
(3, 'LENOVO-X1-CARBON-G11', N'Lenovo ThinkPad X1 Carbon Gen 11 Core i7-1355U / 16GB / 512GB', 'lenovo-thinkpad-x1-carbon-gen-11',
 N'Chuẩn mực laptop doanh nhân, sợi carbon siêu nhẹ chỉ 1.12kg, bàn phím gõ êm nhất thế giới, bảo mật vân tay & khuôn mặt.',
 N'Lenovo', 36800000.00, 18, N'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=800&q=80', 1),

-- 8. Máy tính để bàn PC Gaming
(3, 'PC-GAMING-I7-4070', N'PC Gaming G-Master Core i7-14700K / 32GB DDR5 / RTX 4070 Super', 'pc-gaming-core-i7-14700k-rtx-4070-super',
 N'Bộ case máy tính để bàn chiến game & dựng phim 4K, tản nhiệt nước AIO 360 ARGB, nguồn Corsair 850W Gold chuẩn ATX 3.0.',
 N'G-Master', 38900000.00, 10, N'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=800&q=80', 1),

-- 9. Chuột Logitech Phụ kiện
(5, 'LOGI-MX-MASTER-3S', N'Chuột Không Dây Logitech MX Master 3S Silent', 'chuot-khong-day-logitech-mx-master-3s',
 N'Cảm biến 8000 DPI lướt trên mọi bề mặt kể cả mặt kính, nút bấm tĩnh âm giảm 90% tiếng ồn, cuộn siêu tốc MagSpeed điện từ.',
 N'Logitech', 2190000.00, 120, N'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=800&q=80', 1),

-- 10. Bàn phím cơ Keychron
(5, 'KEYCHRON-Q1-PRO', N'Bàn Phím Cơ Không Dây Keychron Q1 Pro Custom RGB', 'ban-phim-co-keychron-q1-pro-rgb',
 N'Thân nhôm CNC nguyên khối, gasket mount êm ái, kết nối Bluetooth 5.1 & Type-C, switch Banana bấm cực sướng.',
 N'Keychron', 4390000.00, 40, N'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80', 1);
GO

-- 4.5. Thêm Bộ sưu tập nhiều ảnh chi tiết (ProductImages)
INSERT INTO dbo.ProductImages (ProductId, ImageUrl, DisplayOrder, IsThumbnail) VALUES
-- Ảnh iPhone 15 Pro Max
(1, N'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=800&q=80', 1, 1),
(1, N'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=800&q=80', 2, 0),
(1, N'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=800&q=80', 3, 0),

-- Ảnh Samsung Galaxy S24 Ultra
(2, N'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?auto=format&fit=crop&w=800&q=80', 1, 1),
(2, N'https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&w=800&q=80', 2, 0),

-- Ảnh MacBook Pro 14 M3
(4, N'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80', 1, 1),
(4, N'https://images.unsplash.com/photo-1629654297299-c8506221ca97?auto=format&fit=crop&w=800&q=80', 2, 0),
(4, N'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=800&q=80', 3, 0),

-- Ảnh Dell XPS 15
(5, N'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=800&q=80', 1, 1),
(5, N'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=800&q=80', 2, 0);
GO

-- 4.6. Thêm Mã giảm giá (Vouchers)
INSERT INTO dbo.Vouchers (Code, Title, Description, DiscountType, DiscountValue, MinOrderValue, MaxDiscountAmount, UsageLimit, UsedCount, StartDate, EndDate, IsActive) VALUES
('DIENTU2026', N'Giảm 10% Cho Ngành Hàng Điện Tử', N'Áp dụng cho mọi đơn hàng điện tử có giá trị từ 5.000.000đ trở lên, giảm tối đa 1.000.000đ.',
 'PERCENTAGE', 10.00, 5000000.00, 1000000.00, 200, 12, '2026-01-01 00:00:00', '2026-12-31 23:59:59', 1),

('LAPTOP500K', N'Giảm 500.000đ Khi Mua Máy Tính & Laptop', N'Giảm ngay 500K trực tiếp vào hoá đơn từ 15.000.000đ.',
 'FIXED_AMOUNT', 500000.00, 15000000.00, 500000.00, 100, 8, '2026-01-01 00:00:00', '2026-12-31 23:59:59', 1),

('FREESHIP', N'Miễn Phí Vận Chuyển Toàn Quốc', N'Hỗ trợ tối đa 50.000đ phí giao hàng cho đơn hàng từ 1.000.000đ.',
 'FIXED_AMOUNT', 50000.00, 1000000.00, 50000.00, 500, 45, '2026-01-01 00:00:00', '2026-12-31 23:59:59', 1),

('FLASHSALE100', N'Flash Sale Giới Hạn Siêu Giảm Giá', N'Voucher đặc biệt số lượng giới hạn phục vụ kiểm thử concurrency.',
 'FIXED_AMOUNT', 1000000.00, 20000000.00, 1000000.00, 5, 1, '2026-01-01 00:00:00', '2026-12-31 23:59:59', 1);
GO

-- 4.7. Thêm Giỏ hàng & Mặt hàng trong giỏ (Carts & CartItems cho User 2)
INSERT INTO dbo.Carts (UserId) VALUES (2);
DECLARE @CartId BIGINT = SCOPE_IDENTITY();

INSERT INTO dbo.CartItems (CartId, ProductId, Quantity) VALUES
(@CartId, 1, 1), -- 1 chiếc iPhone 15 Pro Max
(@CartId, 9, 2); -- 2 con chuột Logitech MX Master 3S
GO

-- 4.8. Thêm Đơn hàng & Chi tiết đơn hàng mẫu (Orders & OrderDetails)
-- Đơn hàng 1: Khách hàng Nguyễn Văn A mua MacBook Pro, đã giao thành công và thanh toán VNPAY
INSERT INTO dbo.Orders (
    UserId, OrderNumber, Status, PaymentMethod, PaymentStatus, 
    Subtotal, ShippingFee, DiscountAmount, VoucherId, TotalAmount, 
    RecipientName, RecipientPhone, ShippingAddress, CreatedAt
) VALUES (
    2, 'ORD-20260920-0001', 'DELIVERED', 'VNPAY', 'PAID',
    48990000.00, 0.00, 1000000.00, 1, 47990000.00,
    N'Nguyễn Văn A', N'0987654321', N'Số 18, Phố Duy Tân, Phường Dịch Vọng Hậu, Quận Cầu Giấy, Hà Nội',
    DATEADD(day, -5, SYSUTCDATETIME())
);
DECLARE @Order1Id BIGINT = SCOPE_IDENTITY();

INSERT INTO dbo.OrderDetails (OrderId, ProductId, ProductName, SKU, Quantity, UnitPrice) VALUES
(@Order1Id, 4, N'MacBook Pro 14 inch M3 Pro (18GB RAM / 512GB SSD)', 'MACBOOK-PRO-M3-14', 1, 48990000.00);

-- Đơn hàng 2: Khách hàng Trần Thị B mua điện thoại Samsung S24 Ultra, trạng thái đang vận chuyển
INSERT INTO dbo.Orders (
    UserId, OrderNumber, Status, PaymentMethod, PaymentStatus, 
    Subtotal, ShippingFee, DiscountAmount, VoucherId, TotalAmount, 
    RecipientName, RecipientPhone, ShippingAddress, CreatedAt
) VALUES (
    3, 'ORD-20260925-0002', 'SHIPPING', 'COD', 'UNPAID',
    26990000.00, 30000.00, 50000.00, 3, 26970000.00,
    N'Trần Thị B', N'0912345678', N'Tầng 12, Toà nhà Bitexco, Số 2 Hải Triều, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
    DATEADD(day, -1, SYSUTCDATETIME())
);
DECLARE @Order2Id BIGINT = SCOPE_IDENTITY();

INSERT INTO dbo.OrderDetails (OrderId, ProductId, ProductName, SKU, Quantity, UnitPrice) VALUES
(@Order2Id, 2, N'Samsung Galaxy S24 Ultra 5G 256GB Xám Titan', 'SS-S24-ULTRA-256', 1, 26990000.00);
GO

-- 4.9. Thêm Đánh giá mẫu (Reviews)
INSERT INTO dbo.Reviews (UserId, ProductId, Rating, Comment, IsVerifiedPurchase) VALUES
(2, 4, 5, N'MacBook M3 Pro quá mượt mà, render video 4K nhanh như gió, bàn phím gõ nảy và màn hình XDR siêu đẹp!', 1),
(2, 1, 5, N'Màu titan tự nhiên bên ngoài đẹp hơn trong ảnh rất nhiều, cầm nhẹ tay và camera zoom 5x rất rõ nét.', 0),
(3, 2, 5, N'Galaxy AI dịch cuộc gọi trực tiếp rất hữu ích khi làm việc với đối tác nước ngoài. Pin trâu dùng cả ngày không hết.', 1);
GO

-- ==========================================================================================
-- 5. TRUY VẤN KIỂM TRA TÍNH TOÀN VẸN CỦA DỮ LIỆU
-- ==========================================================================================
PRINT N'==> KHỞI TẠO DATABASE VÀ DỮ LIỆU MẪU THÀNH CÔNG!';
SELECT COUNT(*) AS TotalUsers FROM dbo.Users;
SELECT COUNT(*) AS TotalCategories FROM dbo.Categories;
SELECT COUNT(*) AS TotalProducts FROM dbo.Products;
SELECT COUNT(*) AS TotalProductImages FROM dbo.ProductImages;
SELECT COUNT(*) AS TotalOrders FROM dbo.Orders;
SELECT COUNT(*) AS TotalVouchers FROM dbo.Vouchers;
GO
