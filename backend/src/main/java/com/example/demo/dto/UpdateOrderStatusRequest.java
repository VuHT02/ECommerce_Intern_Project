package com.example.demo.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class UpdateOrderStatusRequest {
    @NotBlank
    @Pattern(regexp = "(?i)(PENDING|CONFIRMED|PAID|PROCESSING|SHIPPING|DELIVERED|CANCELLED)")
    private String status;
}
