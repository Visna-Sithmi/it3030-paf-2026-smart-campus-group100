package com.northbridge.backend.controller;

import com.northbridge.backend.service.TicketService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/comments")
public class CommentController {

    private final TicketService ticketService;

    // 🔹 Constructor (Lombok replace)
    public CommentController(TicketService ticketService) {
        this.ticketService = ticketService;
    }

    @DeleteMapping("/{commentId}")
    public ResponseEntity<?> deleteComment(@PathVariable Long commentId) {
        try {
            Long fakeUserId = 1L; // testing/demo
            ticketService.deleteComment(commentId); // ⚠️ updated method call
            return ResponseEntity.ok("Comment deleted successfully");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error deleting comment: " + e.getMessage());
        }
    }
}