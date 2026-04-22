package com.northbridge.backend.service;

import com.northbridge.backend.dto.TicketRequestDTO;
import com.northbridge.backend.dto.TicketResponseDTO;
import com.northbridge.backend.model.*;
import com.northbridge.backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TicketService {

    private final TicketRepository ticketRepository;
    private final StudentRepository studentRepository;
    private final ResourceRepository resourceRepository;
    private final TicketAttachmentRepository attachmentRepository;
    private final TicketCommentRepository commentRepository;

    private final String UPLOAD_DIR = System.getProperty("user.dir") + "/uploads/tickets/";

    @Transactional
    public TicketResponseDTO createTicket(TicketRequestDTO request, Long studentId, List<MultipartFile> files) {
        try {
            if (request.getResourceId() == null) {
                throw new RuntimeException("resourceId is required");
            }

            Student student = studentRepository.findById(studentId)
                    .orElseThrow(() -> new RuntimeException("Student not found with id: " + studentId));

            Resource resource = resourceRepository.findById(request.getResourceId())
                    .orElseThrow(() -> new RuntimeException("Resource not found with id: " + request.getResourceId()));

            IncidentTicket ticket = new IncidentTicket();
            ticket.setResource(resource);
            ticket.setCreatedBy(student);
            ticket.setCategory(request.getCategory());
            ticket.setDescription(request.getDescription());
            ticket.setPriority(request.getPriority());
            ticket.setPreferredContact(request.getPreferredContact());
            ticket.setStatus("OPEN");

            ticket = ticketRepository.save(ticket);

            saveAttachments(ticket, files);

            return convertToDTO(ticketRepository.findById(ticket.getId()).orElse(ticket));

        } catch (IOException e) {
            log.error("Failed to upload files", e);
            throw new RuntimeException("Failed to upload files: " + e.getMessage());
        }
    }

    public TicketResponseDTO getTicketById(Long ticketId) {
        IncidentTicket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found with id: " + ticketId));
        return convertToDTO(ticket);
    }

    @Transactional
    public TicketResponseDTO updateTicketStatus(Long ticketId, String status, String rejectionReason) {
        IncidentTicket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found with id: " + ticketId));

        ticket.setStatus(status);
        if ("REJECTED".equals(status) && rejectionReason != null) {
            ticket.setRejectionReason(rejectionReason);
        }

        return convertToDTO(ticketRepository.save(ticket));
    }

    @Transactional
    public TicketResponseDTO assignTechnician(Long ticketId, Long technicianId) {
        IncidentTicket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found with id: " + ticketId));

        Student technician = studentRepository.findById(technicianId)
                .orElseThrow(() -> new RuntimeException("Technician not found with id: " + technicianId));

        ticket.setAssignedTo(technician);

        return convertToDTO(ticketRepository.save(ticket));
    }

    @Transactional
    public TicketResponseDTO addResolutionNotes(Long ticketId, String resolutionNotes) {
        IncidentTicket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found with id: " + ticketId));

        ticket.setResolutionNotes(resolutionNotes);
        ticket.setStatus("RESOLVED");

        return convertToDTO(ticketRepository.save(ticket));
    }

    @Transactional
    public Map<String, Object> addComment(Long ticketId, Long userId, String commentText) {
        IncidentTicket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found with id: " + ticketId));

        Student user = studentRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        TicketComment comment = new TicketComment();
        comment.setTicket(ticket);
        comment.setUser(user);
        comment.setCommentText(commentText);

        TicketComment saved = commentRepository.save(comment);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("id", saved.getId());
        response.put("ticketId", ticket.getId());
        response.put("userId", user.getId());
        response.put("userName", user.getName());
        response.put("commentText", saved.getCommentText());
        response.put("createdAt", saved.getCreatedAt());

        return response;
    }

    @Transactional
    public void deleteComment(Long commentId, Long userId) {
        TicketComment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Comment not found with id: " + commentId));

        // testing/demo version
        // if you want owner check later:
        // if (!comment.getUser().getId().equals(userId)) {
        //     throw new RuntimeException("You can only delete your own comments");
        // }

        commentRepository.delete(comment);
    }

    @Transactional
    public List<String> uploadTicketImages(Long ticketId, List<MultipartFile> files) {
        try {
            IncidentTicket ticket = ticketRepository.findById(ticketId)
                    .orElseThrow(() -> new RuntimeException("Ticket not found with id: " + ticketId));

            if (files == null || files.isEmpty()) {
                throw new RuntimeException("At least one file is required");
            }

            if (files.size() > 3) {
                throw new RuntimeException("Maximum 3 images allowed");
            }

            saveAttachments(ticket, files);

            IncidentTicket updatedTicket = ticketRepository.findById(ticketId).orElse(ticket);

            List<String> attachmentUrls = new ArrayList<>();
            if (updatedTicket.getAttachments() != null) {
                attachmentUrls = updatedTicket.getAttachments().stream()
                        .map(att -> "/api/uploads/tickets/" + att.getId())
                        .collect(Collectors.toList());
            }

            return attachmentUrls;

        } catch (IOException e) {
            log.error("Failed to upload files", e);
            throw new RuntimeException("Failed to upload files: " + e.getMessage());
        }
    }

    public List<TicketResponseDTO> getTicketsByStudent(Long studentId) {
        return ticketRepository.findByCreatedById(studentId)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<TicketResponseDTO> getAllTickets() {
        return ticketRepository.findAll()
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    private void saveAttachments(IncidentTicket ticket, List<MultipartFile> files) throws IOException {
        if (files != null && !files.isEmpty()) {
            Files.createDirectories(Paths.get(UPLOAD_DIR));

            for (MultipartFile file : files) {
                if (file == null || file.isEmpty()) continue;

                String originalName = file.getOriginalFilename();
                String extension = "";
                if (originalName != null && originalName.contains(".")) {
                    extension = originalName.substring(originalName.lastIndexOf("."));
                }

                String fileName = System.currentTimeMillis() + "_"
                        + UUID.randomUUID().toString().substring(0, 8) + extension;

                Path filePath = Paths.get(UPLOAD_DIR + fileName);
                Files.write(filePath, file.getBytes());

                TicketAttachment attachment = new TicketAttachment();
                attachment.setTicket(ticket);
                attachment.setFileName(originalName);
                attachment.setFilePath(filePath.toString());
                attachment.setFileSize(file.getSize());
                attachment.setUploadedAt(LocalDateTime.now());

                attachmentRepository.save(attachment);

                if (ticket.getAttachments() == null) {
                    ticket.setAttachments(new ArrayList<>());
                }
                ticket.getAttachments().add(attachment);
            }
        }
    }

    private TicketResponseDTO convertToDTO(IncidentTicket ticket) {
        TicketResponseDTO dto = new TicketResponseDTO();
        dto.setId(ticket.getId());
        dto.setResourceName(ticket.getResource() != null ? ticket.getResource().getName() : "N/A");
        dto.setCreatedByName(ticket.getCreatedBy() != null ? ticket.getCreatedBy().getName() : "N/A");
        dto.setAssignedToName(ticket.getAssignedTo() != null ? ticket.getAssignedTo().getName() : null);
        dto.setCategory(ticket.getCategory());
        dto.setDescription(ticket.getDescription());
        dto.setPriority(ticket.getPriority());
        dto.setStatus(ticket.getStatus());
        dto.setRejectionReason(ticket.getRejectionReason());
        dto.setResolutionNotes(ticket.getResolutionNotes());

        List<String> attachmentUrls = new ArrayList<>();
        if (ticket.getAttachments() != null) {
            attachmentUrls = ticket.getAttachments().stream()
                    .map(att -> "/api/uploads/tickets/" + att.getId())
                    .collect(Collectors.toList());
        }
        dto.setAttachmentUrls(attachmentUrls);

        return dto;
    }
}