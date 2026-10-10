package com.example.demo.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class GoogleLoginRequest {

    @NotBlank(message = "Google credential khÃ´ng Ä‘Æ°á»£c Ä‘á»ƒ trá»‘ng.")
    private String credential;
}
