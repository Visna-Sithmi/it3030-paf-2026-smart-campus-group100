package com.northbridge.backend.controller;

import com.northbridge.backend.dto.LoginRequest;
import com.northbridge.backend.dto.LoginResponse;
import com.northbridge.backend.dto.ManagerProfileResponseDTO;
import com.northbridge.backend.dto.ManagerProfileUpdateRequestDTO;
import com.northbridge.backend.model.User;
import com.northbridge.backend.repository.UserRepository;
import com.northbridge.backend.service.UserService;
import jakarta.validation.Valid;
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
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class AuthController {

    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository userRepository;

    // ==================== LOGIN ENDPOINTS ====================

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

    // Lecturer specific login

    @PostMapping("/lecturer/login")
    public ResponseEntity<LoginResponse> lecturerLogin(@RequestBody LoginRequest loginRequest) {
        LoginResponse response = userService.lecturerLogin(loginRequest);

        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.status(401).body(response);
        }
    }

    @PostMapping("/helper-staff/technician/login")
    public ResponseEntity<LoginResponse> technicianLogin(@RequestBody LoginRequest loginRequest) {
        LoginResponse response = userService.helperStaffLogin(loginRequest, "TECHNICIAN");

        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.status(401).body(response);
        }
    }

    @PostMapping("/helper-staff/cleaner/login")
    public ResponseEntity<LoginResponse> cleanerLogin(@RequestBody LoginRequest loginRequest) {
        LoginResponse response = userService.helperStaffLogin(loginRequest, "CLEANER");

        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.status(401).body(response);
        }
    }

    @PostMapping("/helper-staff/security/login")
    public ResponseEntity<LoginResponse> securityLogin(@RequestBody LoginRequest loginRequest) {
        LoginResponse response = userService.helperStaffLogin(loginRequest, "SECURITY");

        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.status(401).body(response);
        }
    }

    @GetMapping("/booking-manager/profile/{id}")
    public ResponseEntity<?> getBookingManagerProfile(@PathVariable Long id) {
        try {
            ManagerProfileResponseDTO profile = userService.getBookingManagerProfile(id);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Booking manager profile fetched successfully",
                    "data", profile
            ));
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", ex.getMessage()
            ));
        }
    }

    @PutMapping("/booking-manager/profile/{id}")
    public ResponseEntity<?> updateBookingManagerProfile(
            @PathVariable Long id,
            @Valid @RequestBody ManagerProfileUpdateRequestDTO request
    ) {
        try {
            ManagerProfileResponseDTO profile = userService.updateBookingManagerProfile(id, request);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Booking manager profile updated successfully",
                    "data", profile
            ));
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", ex.getMessage()
            ));
        }
    }

    @GetMapping("/issue-manager/profile/{id}")
    public ResponseEntity<?> getIssueManagerProfile(@PathVariable Long id) {
        try {
            ManagerProfileResponseDTO profile = userService.getIssueManagerProfile(id);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Issue manager profile fetched successfully",
                    "data", profile
            ));
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", ex.getMessage()
            ));
        }
    }

    @PutMapping("/issue-manager/profile/{id}")
    public ResponseEntity<?> updateIssueManagerProfile(
            @PathVariable Long id,
            @Valid @RequestBody ManagerProfileUpdateRequestDTO request
    ) {
        try {
            ManagerProfileResponseDTO profile = userService.updateIssueManagerProfile(id, request);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Issue manager profile updated successfully",
                    "data", profile
            ));
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", ex.getMessage()
            ));
        }
    }


    // REMOVE THIS - Student login is handled by StudentAuthController
    // @PostMapping("/student/login")
    // public ResponseEntity<StudentLoginResponse> studentLogin(@RequestBody StudentLoginRequest loginRequest) {
    //     StudentLoginResponse response = userService.studentLogin(loginRequest);
    //     ...
    // }

    // ==================== TEST ENDPOINTS ====================

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

    @GetMapping("/test/ping")
    public ResponseEntity<Map<String, String>> ping() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "OK");
        response.put("message", "Auth controller is working!");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/test/create-user")
    public ResponseEntity<Map<String, Object>> createTestUser() {
        Map<String, Object> response = new HashMap<>();
        try {
            if (userRepository.findByEmail("test@test.com").isEmpty()) {
                User testUser = new User();
                testUser.setName("Test User");
                testUser.setEmail("test@test.com");
                testUser.setPassword("test123");
                testUser.setRole("USER");
                userRepository.save(testUser);
                response.put("message", "Test user created successfully");
                response.put("email", "test@test.com");
                response.put("password", "test123");
            } else {
                response.put("message", "Test user already exists");
                response.put("email", "test@test.com");
            }
            response.put("status", "success");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("status", "error");
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
}