package com.northbridge.backend.dto;

import lombok.Data;

import java.util.List;

// TicketResponseDTO.java
@Data
public class TicketResponseDTO {
    private Long id;
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
}
