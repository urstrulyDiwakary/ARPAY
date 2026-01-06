package com.arpay.service.impl;

import com.arpay.dto.PageResponse;
import com.arpay.dto.UserCreateDTO;
import com.arpay.dto.UserDTO;
import com.arpay.entity.User;
import com.arpay.exception.ResourceAlreadyExistsException;
import com.arpay.exception.ResourceNotFoundException;
import com.arpay.repository.UserRepository;
import com.arpay.service.UserService;
import com.arpay.util.MapperUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final MapperUtil mapperUtil;

    @Override
    public UserDTO createUser(UserCreateDTO createDTO) {
        log.info("Creating user with email: {}", createDTO.getEmail());

        if (userRepository.existsByEmail(createDTO.getEmail())) {
            throw new ResourceAlreadyExistsException("User with email " + createDTO.getEmail() + " already exists");
        }

        User user = new User();
        user.setEmployeeId(createDTO.getEmployeeId());
        user.setName(createDTO.getName());
        user.setEmail(createDTO.getEmail());
        user.setPhone(createDTO.getPhone());
        user.setPassword(passwordEncoder.encode(createDTO.getPassword()));
        user.setRole(User.UserRole.valueOf(createDTO.getRole()));
        user.setStatus(User.UserStatus.ACTIVE);
        user.setDepartment(createDTO.getDepartment());
        user.setAvatar(createDTO.getAvatar());
        user.setLastActive(LocalDateTime.now());
        user.setDateOfJoining(createDTO.getDateOfJoining());
        user.setSalary(createDTO.getSalary());

        User savedUser = userRepository.save(user);
        log.info("User created successfully with ID: {}", savedUser.getId());

        return mapperUtil.mapToUserDTO(savedUser);
    }

    @Override
    public UserDTO updateUser(UUID id, UserDTO userDTO) {
        log.info("Updating user with ID: {}", id);

        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + id));

        // Check email uniqueness only if email is being changed
        if (userDTO.getEmail() != null && !user.getEmail().equals(userDTO.getEmail()) &&
            userRepository.existsByEmail(userDTO.getEmail())) {
            throw new ResourceAlreadyExistsException("User with email " + userDTO.getEmail() + " already exists");
        }

        // Update only non-null fields
        if (userDTO.getName() != null) {
            user.setName(userDTO.getName());
        }
        if (userDTO.getEmail() != null) {
            user.setEmail(userDTO.getEmail());
        }
        if (userDTO.getPhone() != null) {
            user.setPhone(userDTO.getPhone());
        }
        if (userDTO.getPassword() != null && !userDTO.getPassword().isEmpty()) {
            // Encode and update password only if provided
            user.setPassword(passwordEncoder.encode(userDTO.getPassword()));
            log.info("Password updated for user ID: {}", id);
        }
        if (userDTO.getRole() != null) {
            user.setRole(userDTO.getRole());
        }
        if (userDTO.getStatus() != null) {
            user.setStatus(userDTO.getStatus());
        }
        if (userDTO.getDepartment() != null) {
            user.setDepartment(userDTO.getDepartment());
        }
        if (userDTO.getAvatar() != null) {
            user.setAvatar(userDTO.getAvatar());
        }
        if (userDTO.getEmployeeId() != null) {
            user.setEmployeeId(userDTO.getEmployeeId());
        }
        if (userDTO.getDateOfJoining() != null) {
            user.setDateOfJoining(userDTO.getDateOfJoining());
        }
        if (userDTO.getSalary() != null) {
            user.setSalary(userDTO.getSalary());
        }

        User updatedUser = userRepository.save(user);
        log.info("User updated successfully with ID: {}", updatedUser.getId());

        return mapperUtil.mapToUserDTO(updatedUser);
    }

    @Override
    public UserDTO updateUserStatus(UUID id, User.UserStatus status) {
        log.info("Updating user status with ID: {} to {}", id, status);

        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + id));

        user.setStatus(status);
        User updatedUser = userRepository.save(user);

        log.info("User status updated successfully with ID: {}", updatedUser.getId());
        return mapperUtil.mapToUserDTO(updatedUser);
    }

    @Override
    @Transactional(readOnly = true)
    public UserDTO getUserById(UUID id) {
        log.info("Fetching user with ID: {}", id);

        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + id));

        return mapperUtil.mapToUserDTO(user);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<UserDTO> getAllUsers(int page, int size, String sortBy, String sortDir) {
        log.info("Fetching all users - page: {}, size: {}", page, size);

        Sort sort = sortDir.equalsIgnoreCase("asc") ?
                    Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<User> userPage = userRepository.findAll(pageable);

        return mapperUtil.mapToPageResponse(userPage, this::mapToUserDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<UserDTO> getUsersByStatus(User.UserStatus status, int page, int size) {
        log.info("Fetching users by status: {}", status);

        Pageable pageable = PageRequest.of(page, size);
        Page<User> userPage = userRepository.findByStatus(status, pageable);

        return mapperUtil.mapToPageResponse(userPage, this::mapToUserDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<UserDTO> searchUsers(String search, int page, int size) {
        log.info("Searching users with query: {}", search);

        Pageable pageable = PageRequest.of(page, size);
        Page<User> userPage = userRepository.searchUsers(search, pageable);

        return mapperUtil.mapToPageResponse(userPage, this::mapToUserDTO);
    }

    @Override
    public void deleteUser(UUID id) {
        log.info("Deleting user with ID: {}", id);

        if (!userRepository.existsById(id)) {
            throw new ResourceNotFoundException("User not found with ID: " + id);
        }

        userRepository.deleteById(id);
        log.info("User deleted successfully with ID: {}", id);
    }

    @Override
    @Transactional(readOnly = true)
    public User findByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
    }

    @Override
    @Transactional(readOnly = true)
    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }

    @Override
    @Transactional(readOnly = true)
    public long countByStatus(User.UserStatus status) {
        return userRepository.countByStatus(status);
    }

    private UserDTO mapToUserDTO(User user) {
        return mapperUtil.mapToUserDTO(user);
    }
}
