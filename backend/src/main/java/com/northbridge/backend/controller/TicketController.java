package com.northbridge.backend.controller;

import com.northbridge.backend.dto.TicketRequestDTO;
import com.northbridge.backend.dto.TicketResponseDTO;
import com.northbridge.backend.dto.TicketReportFilterDTO;
import com.northbridge.backend.dto.TicketStatusUpdateRequestDTO;
import com.northbridge.backend.service.TicketReportService;
import com.northbridge.backend.service.TicketService;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Locale;

@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
@RestController
@RequestMapping("/api/tickets")
public class TicketController {

    private final TicketService ticketService;
    private final TicketReportService ticketReportService;

    // 🔹 Constructor (Lombok replace)
    public TicketController(TicketService ticketService, TicketReportService ticketReportService) {
        this.ticketService = ticketService;
        this.ticketReportService = ticketReportService;
    }


    @GetMapping("/my")
    public ResponseEntity<?> getMyTickets(
            @RequestParam Long userId,
            @RequestParam String role) {
        try {
            List<TicketResponseDTO> tickets = ticketService.getTicketsByUserAndRole(userId, role);
            return ResponseEntity.ok(tickets);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error fetching tickets: " + e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<?> getAllTickets() {
        try {
            return ResponseEntity.ok(ticketService.getAllTickets());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error fetching all tickets: " + e.getMessage());
        }
    }

    @GetMapping("/staff")
    public ResponseEntity<?> getAssignableStaff() {
        try {
            return ResponseEntity.ok(ticketService.getAssignableStaff());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error fetching assignable staff: " + e.getMessage());
        }
    }

    @GetMapping("/{ticketId}")
    public ResponseEntity<?> getTicketById(@PathVariable Long ticketId) {
        try {
            TicketResponseDTO ticket = ticketService.getTicketById(ticketId);
            return ResponseEntity.ok(ticket);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error fetching ticket: " + e.getMessage());
        }
    }

    @GetMapping(value = "/report", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<?> downloadReport(
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String priority,
            @RequestParam(required = false) Long assignedTo,
            @RequestParam(required = false) String search
    ) {
        try {
            String normalizedRole = role == null ? "" : role.trim().toUpperCase(Locale.ROOT);
            if (!"ISSUE_MANAGER".equals(normalizedRole)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Only ISSUE_MANAGER can download ticket reports.");
            }

            TicketReportFilterDTO filter = new TicketReportFilterDTO();
            filter.setFromDate(fromDate);
            filter.setToDate(toDate);
            filter.setStatus(status);
            filter.setPriority(priority);
            filter.setAssignedTo(assignedTo);
            filter.setSearch(search);

            byte[] pdf = ticketReportService.generateReportPdf(filter);

            String filename = "ticket-report-" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd")) + ".pdf";
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.set(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"");
            headers.setContentLength(pdf.length);

            return new ResponseEntity<>(pdf, headers, HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error generating report: " + e.getMessage());
        }
    }

    @PostMapping(consumes = {"multipart/form-data"})
    public ResponseEntity<?> createTicket(
            @RequestParam Long resourceId,
            @RequestParam String category,
            @RequestParam String description,
            @RequestParam String priority,
            @RequestParam(required = false) String preferredContact,
            @RequestParam Long userId,
            @RequestParam String role,
            @RequestParam(required = false) List<MultipartFile> files) {

        try {
            TicketRequestDTO request = new TicketRequestDTO();
            request.setResourceId(resourceId);
            request.setCategory(category);
            request.setDescription(description);
            request.setPriority(priority);
            request.setPreferredContact(preferredContact);

            TicketResponseDTO response = ticketService.createTicket(request, userId, role, files);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error creating ticket: " + e.getMessage());
        }
    }

    @PutMapping("/{ticketId}/status")
    public ResponseEntity<?> updateStatus(
            @PathVariable Long ticketId,
            @RequestBody TicketStatusUpdateRequestDTO request) {

        try {
            TicketResponseDTO response = ticketService.updateTicketStatus(
                    ticketId,
                    request.getStatus(),
                    request.getUserId(),
                    request.getRole(),
                    request.getRejectReason(),
                    request.getResolutionNotes()
            );
            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (RuntimeException e) {
            if (e.getMessage() != null && e.getMessage().toLowerCase().contains("not found")) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
            }
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error updating status: " + e.getMessage());
        }
    }

    @PutMapping("/{ticketId}/assign")
    public ResponseEntity<?> assignStaff(
            @PathVariable Long ticketId,
            @RequestParam Long staffId) {

        try {
            TicketResponseDTO response = ticketService.assignStaff(ticketId, staffId);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error assigning technician: " + e.getMessage());
        }
    }

    @PostMapping("/{ticketId}/comments")
    public ResponseEntity<?> addComment(
            @PathVariable Long ticketId,
            @RequestParam String commentText,
            @RequestParam Long userId,
            @RequestParam String role) {

        try {
            Map<String, Object> response = ticketService.addComment(ticketId, userId, role, commentText);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error adding comment: " + e.getMessage());
        }
    }

    @PostMapping(value = "/{ticketId}/images", consumes = {"multipart/form-data"})
    public ResponseEntity<?> uploadImages(
            @PathVariable Long ticketId,
            @RequestParam List<MultipartFile> files) {

        try {
            List<String> response = ticketService.uploadTicketImages(ticketId, files);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error uploading images: " + e.getMessage());
        }
    }

    @PutMapping("/{ticketId}/resolve")
    public ResponseEntity<?> resolveTicket(
            @PathVariable Long ticketId,
            @RequestParam String notes) {

        try {
            TicketResponseDTO response = ticketService.addResolutionNotes(ticketId, notes);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error resolving ticket: " + e.getMessage());
        }
    }
}