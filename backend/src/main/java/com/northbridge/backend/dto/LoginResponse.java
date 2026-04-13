package com.northbridge.backend.dto;

public class LoginResponse {
    private boolean success;
    private String message;
    private String role;
    private String name;
    private Long id;
    private String email;

    public LoginResponse() {}

    public LoginResponse(boolean success, String message, String role, String name) {
        this.success = success;
        this.message = message;
        this.role = role;
        this.name = name;
    }

    public LoginResponse(boolean success, String message, String role, String name, Long id, String email) {
        this.success = success;
        this.message = message;
        this.role = role;
        this.name = name;
        this.id = id;
        this.email = email;
    }

    // Getters and Setters
    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }
}