package com.northbridge.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class StudentLoginRequest {
    @JsonProperty("studentId")
    private String studentId;

    @JsonProperty("password")
    private String password;

    public StudentLoginRequest() {}

    public StudentLoginRequest(String studentId, String password) {
        this.studentId = studentId;
        this.password = password;
    }

    public String getStudentId() { return studentId; }
    public void setStudentId(String studentId) { this.studentId = studentId; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
}