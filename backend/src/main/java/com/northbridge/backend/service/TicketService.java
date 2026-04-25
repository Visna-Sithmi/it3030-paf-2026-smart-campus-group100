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
    private static final Set<String> STAFF_ROLES = Set.of("TECHNICIAN", "CLEANER", "SECURITY");
    private static final Set<String> MODERATOR_ROLES = Set.of("ADMIN", "ISSUE_MANAGER");
    private static final Set<String> COMMENTER_ROLES = Set.of("STUDENT", "LECTURER", "TECHNICIAN", "CLEANER", "SECURITY");

    private final TicketRepository ticketRepository;
    private final StudentRepository studentRepository;
    private final UserRepository userRepository;
    private final ResourceRepository resourceRepository;
    private final TicketAttachmentRepository attachmentRepository;
    private final TicketCommentRepository commentRepository;

    private final String UPLOAD_DIR = System.getProperty("user.dir") + "/uploads/tickets/";

    // 🔹 Constructor (Lombok replace)
    public TicketService(TicketRepository ticketRepository,
                         StudentRepository studentRepository,
                         UserRepository userRepository,
                         ResourceRepository resourceRepository,
                         TicketAttachmentRepository attachmentRepository,
                         TicketCommentRepository commentRepository) {
        this.ticketRepository = ticketRepository;
        this.studentRepository = studentRepository;
        this.userRepository = userRepository;
        this.resourceRepository = resourceRepository;
        this.attachmentRepository = attachmentRepository;
        this.commentRepository = commentRepository;
    }

    @Transactional
    public TicketResponseDTO createTicket(TicketRequestDTO request, Long userId, String role, List<MultipartFile> files) {
        try {
            if (request.getResourceId() == null) {
                throw new RuntimeException("resourceId is required");
            }

            Resource resource = resourceRepository.findById(request.getResourceId())
                    .orElseThrow(() -> new RuntimeException("Resource not found"));

            IncidentTicket ticket = new IncidentTicket();
            ticket.setResource(resource);
            ticket.setCategory(request.getCategory());
            ticket.setDescription(request.getDescription());
            ticket.setPriority(request.getPriority());
            ticket.setPreferredContact(request.getPreferredContact() != null ? request.getPreferredContact() : "");
            ticket.setStatus("OPEN");
            ticket.setCreatedById(userId);
            ticket.setCreatedByUserId(userId);
            ticket.setCreatedByRole(role);

            if ("STUDENT".equalsIgnoreCase(role)) {
                Student student = studentRepository.findById(userId)
                        .orElseThrow(() -> new RuntimeException("Student not found"));
                ticket.setCreatedByName(student.getName());
            } else {
                User creator = userRepository.findById(userId)
                        .orElseThrow(() -> new RuntimeException("User not found"));
                ticket.setCreatedByName(creator.getName());
            }

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

        String normalizedStatus = status == null ? "" : status.trim().toUpperCase(Locale.ROOT);
        if (!Set.of("OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED", "REJECTED").contains(normalizedStatus)) {
            throw new RuntimeException("Invalid status. Allowed values: OPEN, IN_PROGRESS, RESOLVED, CLOSED, REJECTED");
        }

        ticket.setStatus(normalizedStatus);

        if ("REJECTED".equals(normalizedStatus)) {
            ticket.setRejectionReason(rejectionReason);
        } else {
            ticket.setRejectionReason(null);
        }

        return convertToDTO(ticketRepository.save(ticket));
    }

    @Transactional
    public TicketResponseDTO assignStaff(Long ticketId, Long staffId) {
        IncidentTicket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));

        User staff = userRepository.findById(staffId)
                .orElseThrow(() -> new RuntimeException("Staff member not found"));

        if (!STAFF_ROLES.contains(staff.getRole())) {
            throw new RuntimeException("Only Technician, Cleaner, or Security staff can be assigned");
        }

        ticket.setAssignedStaffId(staff.getId());
        ticket.setAssignedStaffName(staff.getName());
        ticket.setAssignedStaffRole(staff.getRole());

        if ("OPEN".equalsIgnoreCase(ticket.getStatus())) {
            ticket.setStatus("IN_PROGRESS");
        }

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
    public Map<String, Object> addComment(Long ticketId, Long userId, String role, String text) {
        IncidentTicket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));

        String normalizedRole = normalizeRole(role);
        if (!COMMENTER_ROLES.contains(normalizedRole)) {
            throw new RuntimeException("Only Student, Lecturer, and assigned support staff can add comments");
        }
        String userName = resolveCommentAuthorName(userId, normalizedRole);

        TicketComment comment = new TicketComment();
        comment.setTicket(ticket);
        comment.setUserId(userId);
        comment.setUserRole(normalizedRole);
        comment.setUserName(userName);
        comment.setCommentText(text);

        TicketComment saved = commentRepository.save(comment);

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("id", saved.getId());
        res.put("ticketId", ticket.getId());
        res.put("userId", saved.getUserId());
        res.put("userRole", saved.getUserRole());
        res.put("userName", saved.getUserName());
        res.put("commentText", saved.getCommentText());
        res.put("createdAt", saved.getCreatedAt());
        res.put("updatedAt", saved.getUpdatedAt());

        return res;
    }

    @Transactional
    public Map<String, Object> updateComment(Long commentId, Long userId, String role, String text) {
        if (text == null || text.trim().isEmpty()) {
            throw new RuntimeException("commentText is required");
        }

        TicketComment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Comment not found"));

        String normalizedRole = normalizeRole(role);
        enforceCommentOwnership(comment, userId, normalizedRole);

        comment.setCommentText(text.trim());
        TicketComment saved = commentRepository.save(comment);

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("id", saved.getId());
        res.put("ticketId", saved.getTicket().getId());
        res.put("userId", saved.getUserId());
        res.put("userRole", saved.getUserRole());
        res.put("userName", saved.getUserName());
        res.put("commentText", saved.getCommentText());
        res.put("createdAt", saved.getCreatedAt());
        res.put("updatedAt", saved.getUpdatedAt());
        return res;
    }

    @Transactional
    public void deleteComment(Long commentId, Long userId, String role) {
        TicketComment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Comment not found"));

        String normalizedRole = normalizeRole(role);
        enforceCommentOwnership(comment, userId, normalizedRole);
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

    public List<Map<String, Object>> getAssignableStaff() {
        return userRepository.findByRoleIn(List.of("TECHNICIAN", "CLEANER", "SECURITY"))
                .stream()
                .filter(User::isActive)
                .map(user -> {
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("id", user.getId());
                    item.put("name", user.getName());
                    item.put("email", user.getEmail());
                    item.put("role", user.getRole());
                    return item;
                })
                .collect(Collectors.toList());
    }

    public List<TicketResponseDTO> getTicketsByStudent(Long studentId) {
        return ticketRepository.findByCreatedByUserId(studentId)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<TicketResponseDTO> getTicketsByUserAndRole(Long userId, String role) {
        String normalizedRole = role == null ? "" : role.toUpperCase(Locale.ROOT);

        if ("STUDENT".equalsIgnoreCase(role)) {
            return ticketRepository.findByCreatedByUserId(userId)
                    .stream()
                    .map(this::convertToDTO)
                    .collect(Collectors.toList());

        } else if ("LECTURER".equalsIgnoreCase(role)) {
            return ticketRepository.findByCreatedByUserId(userId)
                    .stream()
                    .map(this::convertToDTO)
                    .collect(Collectors.toList());
        } else if (STAFF_ROLES.contains(normalizedRole)) {
            return ticketRepository.findByAssignedStaffId(userId)
                    .stream()
                    .map(this::convertToDTO)
                    .collect(Collectors.toList());

        } else {
            return new ArrayList<>();
        }
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
        dto.setResourceId(ticket.getResource() != null ? ticket.getResource().getId() : null);
        dto.setPreferredContact(ticket.getPreferredContact());
        dto.setCreatedAt(ticket.getCreatedAt());

        dto.setResourceName(ticket.getResource() != null ? ticket.getResource().getName() : "N/A");
        dto.setCreatedByName(ticket.getCreatedByName() != null ? ticket.getCreatedByName() : "N/A");
        dto.setAssignedToId(ticket.getAssignedStaffId());
        dto.setAssignedToName(ticket.getAssignedStaffName());
        dto.setAssignedToRole(ticket.getAssignedStaffRole());

        dto.setCategory(ticket.getCategory());
        dto.setDescription(ticket.getDescription());
        dto.setPriority(ticket.getPriority());
        dto.setStatus(ticket.getStatus());
        dto.setRejectionReason(ticket.getRejectionReason());
        dto.setResolutionNotes(ticket.getResolutionNotes());

        // Add attachments
        List<String> urls = new ArrayList<>();
        if (ticket.getAttachments() != null) {
            urls = ticket.getAttachments().stream()
                    .map(a -> "/api/uploads/tickets/" + a.getId())
                    .collect(Collectors.toList());
        }
        dto.setAttachmentUrls(urls);

        // Add comments
        List<com.northbridge.backend.dto.TicketCommentDTO> commentDTOs = new ArrayList<>();
        if (ticket.getComments() != null) {
            commentDTOs = ticket.getComments().stream()
                    .map(c -> new com.northbridge.backend.dto.TicketCommentDTO(
                            c.getId(),
                            ticket.getId(),
                            c.getUserId(),
                            c.getUserRole(),
                            c.getUserName() != null ? c.getUserName() : "Unknown",
                            c.getCommentText(),
                            c.getCreatedAt()
                    ))
                    .collect(Collectors.toList());
        }
        dto.setComments(commentDTOs);

        return dto;
    }

    private String normalizeRole(String role) {
        if (role == null || role.trim().isEmpty()) {
            throw new RuntimeException("role is required");
        }
        return role.trim().toUpperCase(Locale.ROOT);
    }

    private String resolveCommentAuthorName(Long userId, String role) {
        if ("STUDENT".equals(role)) {
            Student student = studentRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("Student not found"));
            return student.getName();
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return user.getName();
    }

    private void enforceCommentOwnership(TicketComment comment, Long userId, String role) {
        boolean isOwner = Objects.equals(comment.getUserId(), userId)
                && role.equalsIgnoreCase(comment.getUserRole());
        boolean isModerator = MODERATOR_ROLES.contains(role);

        if (!isOwner && !isModerator) {
            throw new RuntimeException("You can only modify your own comments");
        }
    }
}