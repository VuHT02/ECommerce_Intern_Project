package com.example.demo.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdateUserActiveRequest {
    @NotNull
    private Boolean active;
}
