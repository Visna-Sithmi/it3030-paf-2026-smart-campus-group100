package com.northbridge.backend.controller;

import com.northbridge.backend.dto.TicketRequestDTO;
import com.northbridge.backend.dto.TicketResponseDTO;
import com.northbridge.backend.service.TicketService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tickets")
public class TicketController {

    private final TicketService ticketService;

    // 🔹 Constructor (Lombok replace)
    public TicketController(TicketService ticketService) {
        this.ticketService = ticketService;
    }

    @GetMapping
    public ResponseEntity<?> getTickets() {
        try {
            List<TicketResponseDTO> tickets = ticketService.getAllTickets();
            return ResponseEntity.ok(tickets);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error fetching tickets: " + e.getMessage());
        }
    }

    @GetMapping("/my")
    public ResponseEntity<?> getMyTickets() {
        try {
            Long fakeStudentId = 1L;
            List<TicketResponseDTO> tickets = ticketService.getTicketsByStudent(fakeStudentId);
            return ResponseEntity.ok(tickets);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error fetching tickets: " + e.getMessage());
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

    @PostMapping(consumes = {"multipart/form-data"})
    public ResponseEntity<?> createTicket(
            @RequestParam Long resourceId,
            @RequestParam String category,
            @RequestParam String description,
            @RequestParam String priority,
            @RequestParam(required = false) String preferredContact,
            @RequestParam(required = false) List<MultipartFile> files) {

        try {
            Long fakeStudentId = 1L;

            TicketRequestDTO request = new TicketRequestDTO();
            request.setResourceId(resourceId);
            request.setCategory(category);
            request.setDescription(description);
            request.setPriority(priority);
            request.setPreferredContact(preferredContact);

            TicketResponseDTO response = ticketService.createTicket(request, fakeStudentId, files);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error creating ticket: " + e.getMessage());
        }
    }

    @PutMapping("/{ticketId}/status")
    public ResponseEntity<?> updateStatus(
            @PathVariable Long ticketId,
            @RequestParam String status,
            @RequestParam(required = false) String reason) {

        try {
            TicketResponseDTO response = ticketService.updateTicketStatus(ticketId, status, reason);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error updating status: " + e.getMessage());
        }
    }

    @PutMapping("/{ticketId}/assign")
    public ResponseEntity<?> assignTechnician(
            @PathVariable Long ticketId,
            @RequestParam Long technicianId) {

        try {
            TicketResponseDTO response = ticketService.assignTechnician(ticketId, technicianId);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error assigning technician: " + e.getMessage());
        }
    }

    @PostMapping("/{ticketId}/comments")
    public ResponseEntity<?> addComment(
            @PathVariable Long ticketId,
            @RequestParam String commentText) {

        try {
            Long fakeUserId = 1L;
            Map<String, Object> response = ticketService.addComment(ticketId, fakeUserId, commentText);
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