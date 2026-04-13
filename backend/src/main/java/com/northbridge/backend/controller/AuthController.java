package com.northbridge.backend.controller;

import com.northbridge.backend.dto.LoginRequest;
import com.northbridge.backend.dto.LoginResponse;
import com.northbridge.backend.model.User;
import com.northbridge.backend.repository.UserRepository;
import com.northbridge.backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:3000")
public class AuthController {

    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository userRepository;

    // General login for all users (Admin, Managers)
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest loginRequest) {
        LoginResponse response = userService.login(loginRequest);

        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.status(401).body(response);
        }
    }

    // Booking Manager specific login
    @PostMapping("/booking-manager/login")
    public ResponseEntity<LoginResponse> bookingManagerLogin(@RequestBody LoginRequest loginRequest) {
        LoginResponse response = userService.bookingManagerLogin(loginRequest);

        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.status(401).body(response);
        }
    }

    // Resource Manager specific login
    @PostMapping("/resource-manager/login")
    public ResponseEntity<LoginResponse> resourceManagerLogin(@RequestBody LoginRequest loginRequest) {
        LoginResponse response = userService.resourceManagerLogin(loginRequest);

        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.status(401).body(response);
        }
    }

    // Issue Manager specific login
    @PostMapping("/issue-manager/login")
    public ResponseEntity<LoginResponse> issueManagerLogin(@RequestBody LoginRequest loginRequest) {
        LoginResponse response = userService.issueManagerLogin(loginRequest);

        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.status(401).body(response);
        }
    }

    // Test endpoint to check database connection
    @GetMapping("/test/db")
    public ResponseEntity<Map<String, Object>> testDatabase() {
        Map<String, Object> response = new HashMap<>();
        try {
            long count = userRepository.count();
            List<User> users = userRepository.findAll();

            response.put("status", "success");
            response.put("total_users", count);
            response.put("database_url", "jdbc:mysql://localhost:3306/northbridge_university_db");
            response.put("users", users.stream().map(u -> {
                Map<String, Object> userMap = new HashMap<>();
                userMap.put("id", u.getId());
                userMap.put("email", u.getEmail());
                userMap.put("name", u.getName());
                userMap.put("role", u.getRole());
                return userMap;
            }).collect(Collectors.toList()));

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("status", "error");
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    // Test endpoint to check if controller is working
    @GetMapping("/test/ping")
    public ResponseEntity<Map<String, String>> ping() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "OK");
        response.put("message", "Auth controller is working!");
        return ResponseEntity.ok(response);
    }
}