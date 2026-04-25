package com.northbridge.backend.dto;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;

/**
 * Uses camelCase JSON property names; global Jackson config is SNAKE_CASE for other endpoints.
 */
@JsonNaming(PropertyNamingStrategies.LowerCamelCaseStrategy.class)
public class TicketStatusUpdateRequestDTO {

    private String status;
    private Long userId;
    private String role;
    private String rejectReason;
    private String resolutionNotes;

    public TicketStatusUpdateRequestDTO() {
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getRejectReason() {
        return rejectReason;
    }

    public void setRejectReason(String rejectReason) {
        this.rejectReason = rejectReason;
    }

    public String getResolutionNotes() {
        return resolutionNotes;
    }

    public void setResolutionNotes(String resolutionNotes) {
        this.resolutionNotes = resolutionNotes;
    }
}

