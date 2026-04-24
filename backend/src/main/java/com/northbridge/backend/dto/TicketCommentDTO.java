package com.northbridge.backend.dto;

import java.time.LocalDateTime;

public class TicketCommentDTO {

    private Long id;
    private Long ticketId;
    private String userName;
    private String commentText;
    private LocalDateTime createdAt;

    // 🔹 Constructors
    public TicketCommentDTO() {
    }

    public TicketCommentDTO(Long id, Long ticketId, String userName, String commentText, LocalDateTime createdAt) {
        this.id = id;
        this.ticketId = ticketId;
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

    public void setCommentText(String commentText) {
        this.commentText = commentText;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
