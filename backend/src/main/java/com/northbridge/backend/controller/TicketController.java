package com.northbridge.backend.controller;

import com.northbridge.backend.dto.TicketRequestDTO;
import com.northbridge.backend.dto.TicketResponseDTO;
import com.northbridge.backend.service.TicketService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tickets")
@RequiredArgsConstructor
public class TicketController {

    private final TicketService ticketService;

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
            Long fakeStudentId = 1L; // testing/demo
            List<TicketResponseDTO> tickets = ticketService.getTicketsByStudent(fakeStudentId);
            return ResponseEntity.ok(tickets);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error fetching tickets: " + e.getMessage());
        }
    }

    @GetMapping("/all")
    public ResponseEntity<?> getAllTickets() {
        try {
            List<TicketResponseDTO> tickets = ticketService.getAllTickets();
            return ResponseEntity.ok(tickets);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error fetching all tickets: " + e.getMessage());
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
            @RequestParam("resourceId") Long resourceId,
            @RequestParam("category") String category,
            @RequestParam("description") String description,
            @RequestParam("priority") String priority,
            @RequestParam(value = "preferredContact", required = false) String preferredContact,
            @RequestParam(value = "files", required = false) List<MultipartFile> files) {

        try {
            Long fakeStudentId = 1L; // testing/demo

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

    // screenshot requirement: PUT /api/tickets/{id}/assign
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
            Long fakeUserId = 1L; // testing/demo
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
            @RequestParam("files") List<MultipartFile> files) {

        try {
            List<String> response = ticketService.uploadTicketImages(ticketId, files);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error uploading images: " + e.getMessage());
        }
    }

    @PutMapping("/{ticketId}/resolve")
    public ResponseEntity<?> addResolutionNotes(
            @PathVariable Long ticketId,
            @RequestParam String notes) {

        try {
            TicketResponseDTO response = ticketService.addResolutionNotes(ticketId, notes);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error adding resolution notes: " + e.getMessage());
        }
    }
}