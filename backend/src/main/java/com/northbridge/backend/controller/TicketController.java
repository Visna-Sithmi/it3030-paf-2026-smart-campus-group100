package com.northbridge.backend.controller;

import com.northbridge.backend.dto.TicketRequestDTO;
import com.northbridge.backend.dto.TicketResponseDTO;
import com.northbridge.backend.dto.TicketReportFilterDTO;
import com.northbridge.backend.dto.TicketStatusUpdateRequestDTO;
import com.northbridge.backend.model.TicketAttachment;
import com.northbridge.backend.repository.TicketAttachmentRepository;
import com.northbridge.backend.service.TicketReportService;
import com.northbridge.backend.service.TicketService;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.ByteArrayOutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Locale;

@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174", "http://localhost:3000"})
@RestController
@RequestMapping("/api/tickets")
public class TicketController {

    private static final Logger log = LoggerFactory.getLogger(TicketController.class);

    private final TicketService ticketService;
    private final TicketReportService ticketReportService;
    private final TicketAttachmentRepository attachmentRepository;

    // 🔹 Constructor (Lombok replace)
    public TicketController(
            TicketService ticketService,
            TicketReportService ticketReportService,
            TicketAttachmentRepository attachmentRepository
    ) {
        this.ticketService = ticketService;
        this.ticketReportService = ticketReportService;
        this.attachmentRepository = attachmentRepository;
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

    @GetMapping("/uploads/{id}")
    public ResponseEntity<?> getImage(@PathVariable Long id) {
        try {
            TicketAttachment attachment = attachmentRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("File not found"));

            Path path = Paths.get(attachment.getFilePath());

            if (!Files.exists(path)) {
                return ResponseEntity.notFound().build();
            }

            String contentType = Files.probeContentType(path);

            byte[] fileBytes = Files.readAllBytes(path);

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType != null ? contentType : "image/jpeg"))
                    .body(fileBytes);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Image not found");
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

    @PostMapping(value = "/report/html", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> generateHtmlReport(@RequestBody String html) {
        try {
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();

            com.openhtmltopdf.pdfboxout.PdfRendererBuilder builder =
                    new com.openhtmltopdf.pdfboxout.PdfRendererBuilder();

            builder.withHtmlContent(html, null);
            builder.toStream(outputStream);
            builder.run();

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", "report.pdf");

            return new ResponseEntity<>(outputStream.toByteArray(), headers, HttpStatus.OK);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
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

    @PatchMapping("/{ticketId}/complete")
    public ResponseEntity<?> completeTicket(
            @PathVariable Long ticketId,
            @RequestParam Long userId,
            @RequestParam String role) {
        try {
            log.info("PATCH /api/tickets/{}/complete hit (userId={}, role={})", ticketId, userId, role);
            TicketResponseDTO response = ticketService.completeTicket(ticketId, userId, role);
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
                    .body("Error completing ticket: " + e.getMessage());
        }
    }

    @PatchMapping("/{ticketId}/close")
    public ResponseEntity<?> closeTicket(
            @PathVariable Long ticketId,
            @RequestParam Long userId,
            @RequestParam String role) {
        try {
            TicketResponseDTO response = ticketService.closeTicket(ticketId, userId, role);
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
                    .body("Error closing ticket: " + e.getMessage());
        }
    }
}
