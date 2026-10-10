package com.example.demo.service;

import com.example.demo.dto.UpdateUserProfileRequest;
import com.example.demo.dto.UserProfileResponse;

public interface UserAccountService {
    UserProfileResponse getMyProfile(String email);

    UserProfileResponse updateMyProfile(String email, UpdateUserProfileRequest request);
}
