// TicketRequestDTO.java
package com.northbridge.backend.dto;

import lombok.*;
import java.util.List;

@Data
public class TicketRequestDTO {
    private Long resourceId;
    private String category;
    private String description;
    private String priority;
    private String preferredContact;
    private List<String> attachmentBase64; // optional: base64 images
}

