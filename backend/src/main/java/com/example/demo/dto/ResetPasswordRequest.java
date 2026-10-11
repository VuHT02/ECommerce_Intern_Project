package com.example.demo.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Dữ liệu xác minh OTP và đặt mật khẩu mới. */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ResetPasswordRequest {

    @NotBlank(message = "Email không được để trống.")
    @Email(message = "Email không đúng định dạng.")
    private String email;

    @NotBlank(message = "Mã OTP không được để trống.")
    @Pattern(regexp = "\\d{6}", message = "Mã OTP phải gồm đúng 6 chữ số.")
    private String otp;

    @NotBlank(message = "Mật khẩu mới không được để trống.")
    @Size(min = 6, max = 72, message = "Mật khẩu phải dài từ 6 đến 72 ký tự.")
    private String newPassword;
}
