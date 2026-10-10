package com.example.demo.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class UpdateUserRoleRequest {
    @NotBlank
    @Pattern(regexp = "(?i)(CUSTOMER|STAFF|ADMIN|ROLE_CUSTOMER|ROLE_STAFF|ROLE_ADMIN)")
    private String role;
}
