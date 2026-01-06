package com.arpay.service.impl;

import com.arpay.dto.LoginRequest;
import com.arpay.dto.LoginResponse;
import com.arpay.dto.UserDTO;
import com.arpay.entity.User;
import com.arpay.exception.UnauthorizedException;
import com.arpay.repository.UserRepository;
import com.arpay.service.AuthService;
import com.arpay.util.JwtUtil;
import com.arpay.util.MapperUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final MapperUtil mapperUtil;

    @Override
    public LoginResponse login(LoginRequest loginRequest) {
        log.info("Login attempt for email: {}", loginRequest.getEmail());

        User user = userRepository.findByEmail(loginRequest.getEmail())
                .orElseThrow(() -> new UnauthorizedException("Invalid email or password"));

        if (!passwordEncoder.matches(loginRequest.getPassword(), user.getPassword())) {
            log.warn("Invalid password attempt for email: {}", loginRequest.getEmail());
            throw new UnauthorizedException("Invalid email or password");
        }

        if (user.getStatus() != User.UserStatus.ACTIVE) {
            log.warn("Inactive user login attempt: {}", loginRequest.getEmail());
            throw new UnauthorizedException("User account is not active");
        }

        // Update last active
        user.setLastActive(LocalDateTime.now());
        userRepository.save(user);

        String token = jwtUtil.generateToken(user.getEmail());
        UserDTO userDTO = mapperUtil.mapToUserDTO(user);

        log.info("User logged in successfully: {}", loginRequest.getEmail());
        return new LoginResponse(token, userDTO);
    }

    @Override
    public String generateToken(String email) {
        return jwtUtil.generateToken(email);
    }

    @Override
    public boolean validateToken(String token) {
        return jwtUtil.validateToken(token);
    }

    @Override
    public String getEmailFromToken(String token) {
        return jwtUtil.getEmailFromToken(token);
    }
}

