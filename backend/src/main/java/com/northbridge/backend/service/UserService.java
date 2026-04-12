package com.northbridge.backend.service;

import com.northbridge.backend.dto.LoginRequest;
import com.northbridge.backend.dto.LoginResponse;
import com.northbridge.backend.model.User;
import com.northbridge.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.util.Optional;

@Service
public class UserService {

    private static final Logger logger = LoggerFactory.getLogger(UserService.class);

    @Autowired
    private UserRepository userRepository;

    public LoginResponse login(LoginRequest loginRequest) {
        logger.info("=== LOGIN ATTEMPT ===");
        logger.info("Email received: '{}'", loginRequest.getEmail());
        logger.info("Password received: '{}'", loginRequest.getPassword());

        // Try case-sensitive search first
        Optional<User> optionalUser = userRepository.findByEmail(loginRequest.getEmail());

        // If not found, try case-insensitive search
        if (optionalUser.isEmpty()) {
            logger.warn("User not found with exact email: '{}'", loginRequest.getEmail());
            optionalUser = userRepository.findByEmailCaseInsensitive(loginRequest.getEmail());
        }

        if (optionalUser.isEmpty()) {
            logger.error("User NOT found with email: '{}'", loginRequest.getEmail());

            // Log total users in database for debugging
            long totalUsers = userRepository.count();
            logger.info("Total users in database: {}", totalUsers);

            return new LoginResponse(false, "User not found. Total users in DB: " + totalUsers, null, null);
        }

        User user = optionalUser.get();
        logger.info("User found in database:");
        logger.info("  - ID: {}", user.getId());
        logger.info("  - Name: '{}'", user.getName());
        logger.info("  - Email: '{}'", user.getEmail());
        logger.info("  - Password from DB: '{}'", user.getPassword());
        logger.info("  - Role: '{}'", user.getRole());
        logger.info("  - Password provided: '{}'", loginRequest.getPassword());

        if (!user.getPassword().equals(loginRequest.getPassword())) {
            logger.error("Password mismatch for user: {}", loginRequest.getEmail());
            return new LoginResponse(false, "Invalid password", null, null);
        }

        logger.info("Login SUCCESSFUL for user: {}", loginRequest.getEmail());
        return new LoginResponse(true, "Login successful", user.getRole(), user.getName());
    }
}