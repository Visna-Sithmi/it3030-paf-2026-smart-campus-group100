package com.northbridge.backend.controller;

import com.northbridge.backend.dto.ApiResponse;
import com.northbridge.backend.dto.StudentPasswordChangeRequestDTO;
import com.northbridge.backend.dto.StudentLoginRequest;
import com.northbridge.backend.dto.StudentLoginResponse;
import com.northbridge.backend.dto.StudentProfileResponseDTO;
import com.northbridge.backend.dto.StudentProfileUpdateRequestDTO;
import com.northbridge.backend.service.StudentAuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth/student")
@CrossOrigin(origins = "http://localhost:5173")
public class StudentAuthController {

    @Autowired
    private StudentAuthService studentAuthService;

    // Student Login
    @PostMapping("/login")
    public ResponseEntity<StudentLoginResponse> login(@RequestBody StudentLoginRequest loginRequest) {
        StudentLoginResponse response = studentAuthService.login(loginRequest);

        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.status(401).body(response);
        }
    }

    // Check account status
    @GetMapping("/status/{studentId}")
    public ResponseEntity<?> checkAccountStatus(@PathVariable String studentId) {
        boolean isActive = studentAuthService.isAccountActive(studentId);
        String status = studentAuthService.getStudentStatus(studentId);

        return ResponseEntity.ok(new StatusResponse(isActive, status));
    }

    @GetMapping("/profile/{id}")
    public ResponseEntity<ApiResponse> getProfile(@PathVariable Long id) {
        try {
            StudentProfileResponseDTO profile = studentAuthService.getStudentProfile(id);
            return ResponseEntity.ok(new ApiResponse(true, "Profile retrieved successfully", profile));
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ApiResponse(false, ex.getMessage()));
        }
    }

    @PutMapping("/profile/{id}")
    public ResponseEntity<ApiResponse> updateProfile(
            @PathVariable Long id,
            @RequestBody StudentProfileUpdateRequestDTO request
    ) {
        try {
            StudentProfileResponseDTO profile = studentAuthService.updateStudentProfile(id, request);
            return ResponseEntity.ok(new ApiResponse(true, "Profile updated successfully", profile));
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, ex.getMessage()));
        }
    }

    @PutMapping("/profile/{id}/password")
    public ResponseEntity<ApiResponse> changePassword(
            @PathVariable Long id,
            @RequestBody StudentPasswordChangeRequestDTO request
    ) {
        try {
            studentAuthService.updatePasswordById(id, request.getOldPassword(), request.getNewPassword());
            return ResponseEntity.ok(new ApiResponse(true, "Password changed successfully"));
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, ex.getMessage()));
        }
    }

    // Inner class for status response
    static class StatusResponse {
        private boolean active;
        private String status;

        public StatusResponse(boolean active, String status) {
            this.active = active;
            this.status = status;
        }

        public boolean isActive() { return active; }
        public String getStatus() { return status; }
    }
}