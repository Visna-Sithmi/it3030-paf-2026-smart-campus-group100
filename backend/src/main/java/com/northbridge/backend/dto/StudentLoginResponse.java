package com.northbridge.backend.dto;

public class StudentLoginResponse {
    private boolean success;
    private String message;
    private String role;
    private String name;
    private Long id;
    private String studentId;
    private String email;
    private String course;
    private Integer year;
    private String status;

    public StudentLoginResponse() {}

    public StudentLoginResponse(boolean success, String message, String role, String name,
                                Long id, String studentId, String email, String course,
                                Integer year, String status) {
        this.success = success;
        this.message = message;
        this.role = role;
        this.name = name;
        this.id = id;
        this.studentId = studentId;
        this.email = email;
        this.course = course;
        this.year = year;
        this.status = status;
    }

    // Getters and Setters
    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getStudentId() { return studentId; }
    public void setStudentId(String studentId) { this.studentId = studentId; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getCourse() { return course; }
    public void setCourse(String course) { this.course = course; }
    public Integer getYear() { return year; }
    public void setYear(Integer year) { this.year = year; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}