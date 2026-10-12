# TechZone - E-commerce Platform

Ứng dụng thương mại điện tử full-stack dành cho cửa hàng điện tử, gồm website mua sắm cho khách hàng và REST API phục vụ trang quản trị. Dự án được xây dựng theo mô hình tách frontend và backend.

> **CV summary:** Phát triển nền tảng thương mại điện tử full-stack với React và Spring Boot; triển khai xác thực JWT, quản lý sản phẩm/giỏ hàng/đơn hàng, voucher, thanh toán VNPay Sandbox và phân quyền quản trị.

## Tính năng

### Khách hàng

- Duyệt, tìm kiếm và lọc sản phẩm theo từ khóa, danh mục, thương hiệu và khoảng giá; hỗ trợ phân trang và sắp xếp.
- Xem thông tin chi tiết sản phẩm.
- Đăng ký, đăng nhập bằng email/mật khẩu hoặc Google; hỗ trợ refresh token.
- Quên và đặt lại mật khẩu bằng OTP qua email.
- Quản lý giỏ hàng và hồ sơ cá nhân.
- Tạo đơn hàng, áp dụng voucher và theo dõi đơn hàng.
- Thanh toán khi nhận hàng (COD) hoặc chuyển hướng qua VNPay Sandbox.

### Quản trị

- Dashboard thống kê.
- Quản lý sản phẩm, bao gồm tìm kiếm/lọc và theo dõi sản phẩm sắp hết hàng.
- Theo dõi đơn hàng theo trạng thái, trạng thái thanh toán, từ khóa và ngày.
- Cập nhật trạng thái xử lý đơn hàng.
- Quản lý người dùng, vai trò và trạng thái tài khoản.
- Phân quyền theo vai trò `ADMIN` và `STAFF`; một số thao tác quản lý người dùng chỉ dành cho `ADMIN`.

### Nghiệp vụ và bảo mật

- JWT stateless với access token và refresh token; mật khẩu được mã hóa bằng BCrypt.
- Kiểm tra tồn kho và khóa dữ liệu sản phẩm khi tạo đơn hàng để hạn chế bán vượt tồn trong các giao dịch đồng thời.
- Tính phí giao hàng, kiểm tra điều kiện voucher và cập nhật lượt sử dụng.
- Nhận callback/IPN từ VNPay để xử lý kết quả thanh toán.
- Validation request và phản hồi lỗi API thống nhất.

## Công nghệ

| Thành phần | Công nghệ |
| --- | --- |
| Frontend | React 19, Vite 8, React Router, Tailwind CSS 4 |
| Quản lý trạng thái/dữ liệu | Zustand, TanStack React Query |
| Form và giao diện | React Hook Form, Lucide React, React Toastify |
| Backend | Java 21, Spring Boot 4, Spring MVC, Spring Data JPA |
| Bảo mật | Spring Security, JWT (JJWT), BCrypt, Google Identity |
| Cơ sở dữ liệu | Microsoft SQL Server; H2 cho kiểm thử |
| Tích hợp | VNPay Sandbox, SMTP |
| Kiểm thử | JUnit 5, Mockito, Spring Boot Test |
| Build tools | Maven Wrapper, npm |

## Yêu cầu

- JDK 21.
- Node.js 22.12+ và npm.
- Microsoft SQL Server đang chạy và cho phép kết nối từ backend.

## Cài đặt và chạy local

### 1. Chuẩn bị cơ sở dữ liệu

Tạo database `ecommerce` trên SQL Server hoặc cập nhật `DB_URL` để trỏ đến database bạn muốn dùng. Backend dùng Hibernate `ddl-auto=update` trong cấu hình hiện tại để tạo/cập nhật schema khi chạy; nên dùng database phát triển riêng, không dùng cách này cho môi trường production.

### 2. Chạy backend

Mở PowerShell tại thư mục dự án, cấu hình biến môi trường cho phiên terminal hiện tại. Thay các giá trị placeholder bằng thông tin môi trường của bạn:

```powershell
$env:DB_URL = "jdbc:sqlserver://localhost:1433;databaseName=ecommerce;encrypt=true;trustServerCertificate=true"
$env:DB_USERNAME = "your_sql_server_username"
$env:DB_PASSWORD = "your_sql_server_password"
$env:JWT_SECRET = "replace-with-a-random-secret-at-least-32-bytes-long"

# Tùy chọn: cấu hình Google Sign-In bằng cùng một Client ID ở frontend và backend.
$env:GOOGLE_CLIENT_ID = "your-google-client-id"

cd backend
.\mvnw.cmd spring-boot:run
```

Backend mặc định chạy tại `http://localhost:8080`. `JWT_SECRET` là bắt buộc. Không commit secret, mật khẩu, thông tin SMTP hoặc thông tin thanh toán vào Git.

Các tích hợp tùy chọn:

- **Google Sign-In:** đặt `GOOGLE_CLIENT_ID` cho backend; frontend dùng cùng giá trị trong `VITE_GOOGLE_CLIENT_ID`.
- **VNPay:** thiết lập `VNPAY_TMN_CODE` và `VNPAY_HASH_SECRET` theo tài khoản Sandbox. Có thể cấu hình thêm `VNPAY_PAY_URL`, `VNPAY_RETURN_URL`, `VNPAY_IPN_URL`. IPN cần trỏ tới backend có thể truy cập được từ phía VNPay.
- **Email OTP:** cấu hình `SPRING_MAIL_HOST`, `SPRING_MAIL_PORT`, `SPRING_MAIL_USERNAME`, `SPRING_MAIL_PASSWORD` và các thiết lập SMTP phù hợp với nhà cung cấp email.

### 3. Chạy frontend

Mở terminal khác:

```powershell
cd frontend
Copy-Item .env.example .env
npm ci
npm run dev
```

Frontend mặc định chạy tại `http://localhost:5173` và gọi API tại `http://localhost:8080/api`. Có thể đổi cấu hình trong `frontend/.env`:

```dotenv
VITE_API_BASE_URL=http://localhost:8080/api
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

`VITE_GOOGLE_CLIENT_ID` không bắt buộc nếu không sử dụng Google Sign-In. CORS của backend hiện cho phép origin local `http://localhost:5173`; cần cập nhật cấu hình khi triển khai frontend ở domain khác.

## Kiểm thử và build

Chạy backend tests:

```powershell
cd backend
.\mvnw.cmd test
```

Chạy kiểm tra và build frontend:

```powershell
cd frontend
npm run lint
npm run build
```

Các bài test backend hiện có bao gồm kiểm thử service đơn hàng/giỏ hàng, kiểm thử controller đơn hàng và kiểm thử xử lý đơn hàng đồng thời.

## API chính

Base URL local: `http://localhost:8080/api`

| Nhóm endpoint | Chức năng |
| --- | --- |
| `/auth` | Đăng ký, đăng nhập, Google Sign-In, refresh token và đặt lại mật khẩu |
| `/products`, `/categories` | Duyệt, tìm kiếm sản phẩm và danh mục |
| `/cart` | Thao tác với giỏ hàng |
| `/orders` | Tạo, tra cứu và cập nhật đơn hàng |
| `/vouchers` | Liệt kê và kiểm tra voucher |
| `/payment`, `/v1/payments` | Tạo phiên thanh toán và nhận callback VNPay |
| `/admin` | Dashboard và quản lý sản phẩm/đơn hàng |
| `/admin/users` | Quản lý người dùng dành cho quản trị viên |
| `/users/me` | Hồ sơ tài khoản hiện tại |

Các endpoint yêu cầu đăng nhập sử dụng access token dạng Bearer:

```http
Authorization: Bearer <access-token>
```

## Cấu trúc thư mục

```text
backend/
  src/main/java/com/example/demo/
    controller/    REST API controllers
    service/       Nghiệp vụ ứng dụng
    repository/    Truy cập dữ liệu
    entity/        Entity và mô hình dữ liệu
    dto/           Request/response DTO
    security/      JWT và cấu hình Spring Security
  src/test/        Backend tests
frontend/
  src/pages/       Trang mua sắm và trang quản trị
  src/components/  Thành phần giao diện dùng chung
  src/services/    Tích hợp REST API
  src/store/       Trạng thái xác thực và giỏ hàng
```


