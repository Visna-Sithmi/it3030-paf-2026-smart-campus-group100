package com.northbridge.backend.dto;

import java.time.LocalDateTime;
import java.util.List;

public class TicketResponseDTO {

    private Long id;
    private Long resourceId;
    private String resourceName;
    private String createdByName;
    private String assignedToName;
    private String category;
    private String description;
    private String priority;
    private String status;
    private String rejectionReason;
    private String resolutionNotes;
    private List<String> attachmentUrls;
    private String preferredContact;
    private LocalDateTime createdAt;
    private List<TicketCommentDTO> comments;

    // 🔹 Default Constructor
    public TicketResponseDTO() {
    }

    // 🔹 All Args Constructor
    public TicketResponseDTO(Long id, String resourceName, String createdByName, String assignedToName,
                             String category, String description, String priority, String status,
                             String rejectionReason, String resolutionNotes, List<String> attachmentUrls) {
        this.id = id;
        this.resourceName = resourceName;
        this.createdByName = createdByName;
        this.assignedToName = assignedToName;
        this.category = category;
        this.description = description;
        this.priority = priority;
        this.status = status;
        this.rejectionReason = rejectionReason;
        this.resolutionNotes = resolutionNotes;
        this.attachmentUrls = attachmentUrls;
    }

    // 🔹 Getters

    public Long getId() {
        return id;
    }

    public Long getResourceId() {
        return resourceId;
    }

    public String getResourceName() {
        return resourceName;
    }

    public String getCreatedByName() {
        return createdByName;
    }

    public String getAssignedToName() {
        return assignedToName;
    }

    public String getCategory() {
        return category;
    }

    public String getDescription() {
        return description;
    }

    public String getPriority() {
        return priority;
    }

    public String getStatus() {
        return status;
    }

    public String getRejectionReason() {
        return rejectionReason;
    }

    public String getResolutionNotes() {
        return resolutionNotes;
    }

    public List<String> getAttachmentUrls() {
        return attachmentUrls;
    }

    public String getPreferredContact() { return preferredContact; }

    public LocalDateTime getCreatedAt() { return createdAt; }

    // 🔹 Setters

    public void setId(Long id) {
        this.id = id;
    }

    public void setResourceId(Long resourceId) { this.resourceId = resourceId; }

    public void setResourceName(String resourceName) {
        this.resourceName = resourceName;
    }

    public void setCreatedByName(String createdByName) {
        this.createdByName = createdByName;
    }

    public void setAssignedToName(String assignedToName) {
        this.assignedToName = assignedToName;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public void setPriority(String priority) {
        this.priority = priority;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public void setRejectionReason(String rejectionReason) {
        this.rejectionReason = rejectionReason;
    }

    public void setResolutionNotes(String resolutionNotes) {
        this.resolutionNotes = resolutionNotes;
    }

    public void setAttachmentUrls(List<String> attachmentUrls) {
        this.attachmentUrls = attachmentUrls;
    }

    public void setPreferredContact(String preferredContact) { this.preferredContact = preferredContact; }

    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public List<TicketCommentDTO> getComments() {
        return comments;
    }

    public void setComments(List<TicketCommentDTO> comments) {
        this.comments = comments;
    }
}