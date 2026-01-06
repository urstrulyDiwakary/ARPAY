package com.arpay.service;

import com.arpay.dto.LoginRequest;
import com.arpay.dto.LoginResponse;

public interface AuthService {
    LoginResponse login(LoginRequest loginRequest);
    String generateToken(String email);
    boolean validateToken(String token);
    String getEmailFromToken(String token);
}

