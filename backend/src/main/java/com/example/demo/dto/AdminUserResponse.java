package com.example.demo.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class AdminUserResponse {
    private Long id;
    private String email;
    private String fullName;
    private String phone;
    private String role;
    private boolean active;
    private LocalDateTime createdAt;
}
