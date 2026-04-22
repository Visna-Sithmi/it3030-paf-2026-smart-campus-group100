package com.northbridge.backend.service;

import com.northbridge.backend.dto.TicketRequestDTO;
import com.northbridge.backend.dto.TicketResponseDTO;
import com.northbridge.backend.model.*;
import com.northbridge.backend.repository.*;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.nio.file.*;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class TicketService {

    private static final Logger log = LoggerFactory.getLogger(TicketService.class);

    private final TicketRepository ticketRepository;
    private final StudentRepository studentRepository;
    private final ResourceRepository resourceRepository;
    private final TicketAttachmentRepository attachmentRepository;
    private final TicketCommentRepository commentRepository;

    private final String UPLOAD_DIR = System.getProperty("user.dir") + "/uploads/tickets/";

    // 🔹 Constructor (Lombok replace)
    public TicketService(TicketRepository ticketRepository,
                         StudentRepository studentRepository,
                         ResourceRepository resourceRepository,
                         TicketAttachmentRepository attachmentRepository,
                         TicketCommentRepository commentRepository) {
        this.ticketRepository = ticketRepository;
        this.studentRepository = studentRepository;
        this.resourceRepository = resourceRepository;
        this.attachmentRepository = attachmentRepository;
        this.commentRepository = commentRepository;
    }

    @Transactional
    public TicketResponseDTO createTicket(TicketRequestDTO request, Long studentId, List<MultipartFile> files) {
        try {
            if (request.getResourceId() == null) {
                throw new RuntimeException("resourceId is required");
            }

            Student student = studentRepository.findById(studentId)
                    .orElseThrow(() -> new RuntimeException("Student not found"));

            Resource resource = resourceRepository.findById(request.getResourceId())
                    .orElseThrow(() -> new RuntimeException("Resource not found"));

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
            log.error("File upload error", e);
            throw new RuntimeException("File upload failed");
        }
    }

    public TicketResponseDTO getTicketById(Long ticketId) {
        IncidentTicket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));
        return convertToDTO(ticket);
    }

    @Transactional
    public TicketResponseDTO updateTicketStatus(Long ticketId, String status, String rejectionReason) {
        IncidentTicket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));

        ticket.setStatus(status);

        if ("REJECTED".equals(status)) {
            ticket.setRejectionReason(rejectionReason);
        }

        return convertToDTO(ticketRepository.save(ticket));
    }

    @Transactional
    public TicketResponseDTO assignTechnician(Long ticketId, Long technicianId) {
        IncidentTicket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));

        Student technician = studentRepository.findById(technicianId)
                .orElseThrow(() -> new RuntimeException("Technician not found"));

        ticket.setAssignedTo(technician);

        return convertToDTO(ticketRepository.save(ticket));
    }

    @Transactional
    public TicketResponseDTO addResolutionNotes(Long ticketId, String notes) {
        IncidentTicket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));

        ticket.setResolutionNotes(notes);
        ticket.setStatus("RESOLVED");

        return convertToDTO(ticketRepository.save(ticket));
    }

    @Transactional
    public Map<String, Object> addComment(Long ticketId, Long userId, String text) {
        IncidentTicket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));

        Student user = studentRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        TicketComment comment = new TicketComment();
        comment.setTicket(ticket);
        comment.setUser(user);
        comment.setCommentText(text);

        TicketComment saved = commentRepository.save(comment);

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("id", saved.getId());
        res.put("ticketId", ticket.getId());
        res.put("userName", user.getName());
        res.put("commentText", saved.getCommentText());
        res.put("createdAt", saved.getCreatedAt());

        return res;
    }

    @Transactional
    public void deleteComment(Long commentId) {
        TicketComment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Comment not found"));

        commentRepository.delete(comment);
    }

    @Transactional
    public List<String> uploadTicketImages(Long ticketId, List<MultipartFile> files) {
        try {
            IncidentTicket ticket = ticketRepository.findById(ticketId)
                    .orElseThrow(() -> new RuntimeException("Ticket not found"));

            if (files == null || files.isEmpty()) {
                throw new RuntimeException("No files");
            }

            if (files.size() > 3) {
                throw new RuntimeException("Max 3 images");
            }

            saveAttachments(ticket, files);

            return ticket.getAttachments().stream()
                    .map(att -> "/api/uploads/tickets/" + att.getId())
                    .collect(Collectors.toList());

        } catch (IOException e) {
            log.error("Upload error", e);
            throw new RuntimeException("Upload failed");
        }
    }

    public List<TicketResponseDTO> getAllTickets() {
        return ticketRepository.findAll()
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<TicketResponseDTO> getTicketsByStudent(Long studentId) {
        return ticketRepository.findByCreatedById(studentId)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    private void saveAttachments(IncidentTicket ticket, List<MultipartFile> files) throws IOException {
        if (files == null) return;

        Files.createDirectories(Paths.get(UPLOAD_DIR));

        for (MultipartFile file : files) {
            if (file.isEmpty()) continue;

            String name = System.currentTimeMillis() + "_" + file.getOriginalFilename();
            Path path = Paths.get(UPLOAD_DIR + name);
            Files.write(path, file.getBytes());

            TicketAttachment att = new TicketAttachment();
            att.setTicket(ticket);
            att.setFileName(file.getOriginalFilename());
            att.setFilePath(path.toString());
            att.setFileSize(file.getSize());
            att.setUploadedAt(LocalDateTime.now());

            attachmentRepository.save(att);

            ticket.getAttachments().add(att);
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

        List<String> urls = new ArrayList<>();
        if (ticket.getAttachments() != null) {
            urls = ticket.getAttachments().stream()
                    .map(a -> "/api/uploads/tickets/" + a.getId())
                    .collect(Collectors.toList());
        }

        dto.setAttachmentUrls(urls);

        return dto;
    }
}