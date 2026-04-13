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

    // General login for all users
    public LoginResponse login(LoginRequest loginRequest) {
        logger.info("=== LOGIN ATTEMPT ===");
        logger.info("Email received: '{}'", loginRequest.getEmail());

        Optional<User> optionalUser = userRepository.findByEmail(loginRequest.getEmail());

        if (optionalUser.isEmpty()) {
            logger.error("User NOT found with email: '{}'", loginRequest.getEmail());
            return new LoginResponse(false, "Invalid email or password", null, null);
        }

        User user = optionalUser.get();

        if (!user.getPassword().equals(loginRequest.getPassword())) {
            logger.error("Password mismatch for user: {}", loginRequest.getEmail());
            return new LoginResponse(false, "Invalid email or password", null, null);
        }

        logger.info("Login SUCCESSFUL for user: {} with role: {}", user.getEmail(), user.getRole());
        return new LoginResponse(true, "Login successful", user.getRole(), user.getName(), user.getId(), user.getEmail());
    }

    // Booking Manager specific login
    public LoginResponse bookingManagerLogin(LoginRequest loginRequest) {
        logger.info("Booking Manager login attempt for email: {}", loginRequest.getEmail());

        Optional<User> optionalUser = userRepository.findByEmail(loginRequest.getEmail());

        if (optionalUser.isEmpty()) {
            return new LoginResponse(false, "Invalid email or password", null, null);
        }

        User user = optionalUser.get();

        // Check if user is a Booking Manager
        if (!"BOOKING_MANAGER".equals(user.getRole())) {
            logger.warn("User {} is not a Booking Manager. Role: {}", user.getEmail(), user.getRole());
            return new LoginResponse(false, "Access denied. Booking Manager only.", null, null);
        }

        if (!user.getPassword().equals(loginRequest.getPassword())) {
            return new LoginResponse(false, "Invalid email or password", null, null);
        }

        logger.info("Booking Manager login successful: {}", user.getEmail());
        return new LoginResponse(true, "Booking Manager login successful", user.getRole(), user.getName(), user.getId(), user.getEmail());
    }

    // Resource Manager specific login
    public LoginResponse resourceManagerLogin(LoginRequest loginRequest) {
        logger.info("Resource Manager login attempt for email: {}", loginRequest.getEmail());

        Optional<User> optionalUser = userRepository.findByEmail(loginRequest.getEmail());

        if (optionalUser.isEmpty()) {
            return new LoginResponse(false, "Invalid email or password", null, null);
        }

        User user = optionalUser.get();

        // Check if user is a Resource Manager
        if (!"RESOURCE_MANAGER".equals(user.getRole())) {
            logger.warn("User {} is not a Resource Manager. Role: {}", user.getEmail(), user.getRole());
            return new LoginResponse(false, "Access denied. Resource Manager only.", null, null);
        }

        if (!user.getPassword().equals(loginRequest.getPassword())) {
            return new LoginResponse(false, "Invalid email or password", null, null);
        }

        logger.info("Resource Manager login successful: {}", user.getEmail());
        return new LoginResponse(true, "Resource Manager login successful", user.getRole(), user.getName(), user.getId(), user.getEmail());
    }

    // Issue Manager specific login
    public LoginResponse issueManagerLogin(LoginRequest loginRequest) {
        logger.info("Issue Manager login attempt for email: {}", loginRequest.getEmail());

        Optional<User> optionalUser = userRepository.findByEmail(loginRequest.getEmail());

        if (optionalUser.isEmpty()) {
            return new LoginResponse(false, "Invalid email or password", null, null);
        }

        User user = optionalUser.get();

        // Check if user is an Issue Manager
        if (!"ISSUE_MANAGER".equals(user.getRole())) {
            logger.warn("User {} is not an Issue Manager. Role: {}", user.getEmail(), user.getRole());
            return new LoginResponse(false, "Access denied. Issue Manager only.", null, null);
        }

        if (!user.getPassword().equals(loginRequest.getPassword())) {
            return new LoginResponse(false, "Invalid email or password", null, null);
        }

        logger.info("Issue Manager login successful: {}", user.getEmail());
        return new LoginResponse(true, "Issue Manager login successful", user.getRole(), user.getName(), user.getId(), user.getEmail());
    }
}