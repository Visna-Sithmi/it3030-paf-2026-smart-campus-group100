package com.northbridge.backend.controller;

import com.northbridge.backend.dto.StudentLoginRequest;
import com.northbridge.backend.dto.StudentLoginResponse;
import com.northbridge.backend.service.StudentAuthService;
import org.springframework.beans.factory.annotation.Autowired;
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