package com.northbridge.backend.dto;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;

import java.time.LocalDateTime;

@JsonNaming(PropertyNamingStrategies.LowerCamelCaseStrategy.class)
public class TicketCommentDTO {

    private Long id;
    private Long ticketId;
    private Long userId;
    private String userRole;
    private String userName;
    private String commentText;
    private LocalDateTime createdAt;

    // 🔹 Constructors
    public TicketCommentDTO() {
    }

    public TicketCommentDTO(
            Long id,
            Long ticketId,
            Long userId,
            String userRole,
            String userName,
            String commentText,
            LocalDateTime createdAt
    ) {
        this.id = id;
        this.ticketId = ticketId;
        this.userId = userId;
        this.userRole = userRole;
        this.userName = userName;
        this.commentText = commentText;
        this.createdAt = createdAt;
    }

    // 🔹 Getters
    public Long getId() {
        return id;
    }

    public Long getTicketId() {
        return ticketId;
    }

    public String getUserName() {
        return userName;
    }

    public Long getUserId() {
        return userId;
    }

    public String getUserRole() {
        return userRole;
    }

    public String getCommentText() {
        return commentText;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    // 🔹 Setters
    public void setId(Long id) {
        this.id = id;
    }

    public void setTicketId(Long ticketId) {
        this.ticketId = ticketId;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public void setUserRole(String userRole) {
        this.userRole = userRole;
    }

    public void setCommentText(String commentText) {
        this.commentText = commentText;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
