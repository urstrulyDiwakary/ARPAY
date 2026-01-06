package com.arpay.service;

import com.arpay.dto.PageResponse;
import com.arpay.dto.UserCreateDTO;
import com.arpay.dto.UserDTO;
import com.arpay.entity.User;

import java.util.UUID;

public interface UserService {
    UserDTO createUser(UserCreateDTO createDTO);
    UserDTO updateUser(UUID id, UserDTO userDTO);
    UserDTO updateUserStatus(UUID id, User.UserStatus status);
    UserDTO getUserById(UUID id);
    PageResponse<UserDTO> getAllUsers(int page, int size, String sortBy, String sortDir);
    PageResponse<UserDTO> getUsersByStatus(User.UserStatus status, int page, int size);
    PageResponse<UserDTO> searchUsers(String search, int page, int size);
    void deleteUser(UUID id);
    User findByEmail(String email);
    boolean existsByEmail(String email);
    long countByStatus(User.UserStatus status);
}


