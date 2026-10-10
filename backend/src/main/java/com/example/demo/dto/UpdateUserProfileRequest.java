package com.example.demo.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateUserProfileRequest {
    @NotBlank(message = "Họ tên không được để trống.")
    @Size(max = 150, message = "Họ tên tối đa 150 ký tự.")
    private String fullName;

    @Size(max = 20, message = "Số điện thoại tối đa 20 ký tự.")
    private String phone;
}
