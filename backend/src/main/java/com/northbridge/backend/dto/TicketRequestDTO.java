package com.northbridge.backend.dto;

import java.util.List;

public class TicketRequestDTO {

    private Long resourceId;
    private String category;
    private String description;
    private String priority;
    private String preferredContact;
    private List<String> attachmentBase64;

    // 🔹 Default Constructor
    public TicketRequestDTO() {
    }

    // 🔹 All Args Constructor
    public TicketRequestDTO(Long resourceId, String category, String description,
                            String priority, String preferredContact,
                            List<String> attachmentBase64) {
        this.resourceId = resourceId;
        this.category = category;
        this.description = description;
        this.priority = priority;
        this.preferredContact = preferredContact;
        this.attachmentBase64 = attachmentBase64;
    }

    // 🔹 Getters

    public Long getResourceId() {
        return resourceId;
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

    public String getPreferredContact() {
        return preferredContact;
    }

    public List<String> getAttachmentBase64() {
        return attachmentBase64;
    }

    // 🔹 Setters

    public void setResourceId(Long resourceId) {
        this.resourceId = resourceId;
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

    public void setPreferredContact(String preferredContact) {
        this.preferredContact = preferredContact;
    }

    public void setAttachmentBase64(List<String> attachmentBase64) {
        this.attachmentBase64 = attachmentBase64;
    }
}