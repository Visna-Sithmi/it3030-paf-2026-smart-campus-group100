package com.northbridge.backend.controller;

import com.northbridge.backend.dto.ApiResponse;
import com.northbridge.backend.dto.BookingRequestDTO;
import com.northbridge.backend.dto.BookingResponseDTO;
import com.northbridge.backend.dto.BookingSlotDTO;
import com.northbridge.backend.service.BookingService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/bookings")
@CrossOrigin(origins = "http://localhost:5173")
@Validated
public class BookingController {

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse> createBooking(
            @Valid @RequestBody BookingRequestDTO requestDTO,
            @RequestHeader("X-User-Id") Long userId,
            @RequestHeader("X-User-Role") String userRole
    ) {
        BookingResponseDTO responseDTO = bookingService.createBooking(requestDTO, userId, userRole);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse(true, "Booking request created successfully", responseDTO));
    }

    @GetMapping("/my")
    public ResponseEntity<ApiResponse> getMyBookings(
            @RequestHeader("X-User-Id") Long userId,
            @RequestHeader("X-User-Role") String userRole
    ) {
        List<BookingResponseDTO> bookings = bookingService.getMyBookings(userId, userRole);
        return ResponseEntity.ok(new ApiResponse(true, "My bookings fetched successfully", bookings));
    }

    @GetMapping
    public ResponseEntity<ApiResponse> getAllBookings(
            @RequestHeader("X-User-Role") String userRole
    ) {
        List<BookingResponseDTO> bookings = bookingService.getAllBookings(userRole);
        return ResponseEntity.ok(new ApiResponse(true, "All bookings fetched successfully", bookings));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse> getBookingById(
            @PathVariable Long id,
            @RequestHeader("X-User-Id") Long userId,
            @RequestHeader("X-User-Role") String userRole
    ) {
        BookingResponseDTO booking = bookingService.getBookingById(id, userId, userRole);
        return ResponseEntity.ok(new ApiResponse(true, "Booking fetched successfully", booking));
    }

    @GetMapping("/resource/{resourceId}/slots")
    public ResponseEntity<ApiResponse> getBookedSlotsForResourceDate(
            @PathVariable Long resourceId,
            @RequestParam("date") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate bookingDate,
            @RequestHeader("X-User-Id") Long userId,
            @RequestHeader("X-User-Role") String userRole
    ) {
        List<BookingSlotDTO> slots = bookingService.getBookedSlotsForResourceDate(resourceId, bookingDate, userId, userRole);
        return ResponseEntity.ok(new ApiResponse(true, "Booked slots fetched successfully", slots));
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<ApiResponse> approveBooking(
            @PathVariable Long id,
            @RequestHeader("X-User-Id") Long adminId,
            @RequestHeader("X-User-Role") String adminRole
    ) {
        BookingResponseDTO booking = bookingService.approveBooking(id, adminId, adminRole);
        return ResponseEntity.ok(new ApiResponse(true, "Booking approved successfully", booking));
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<ApiResponse> rejectBooking(
            @PathVariable Long id,
            @RequestParam("reason") @NotBlank(message = "reason is required") String reason,
            @RequestHeader("X-User-Id") Long adminId,
            @RequestHeader("X-User-Role") String adminRole
    ) {
        BookingResponseDTO booking = bookingService.rejectBooking(id, reason, adminId, adminRole);
        return ResponseEntity.ok(new ApiResponse(true, "Booking rejected successfully", booking));
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse> cancelBooking(
            @PathVariable Long id,
            @RequestHeader("X-User-Id") Long userId,
            @RequestHeader("X-User-Role") String userRole
    ) {
        BookingResponseDTO booking = bookingService.cancelBooking(id, userId, userRole);
        return ResponseEntity.ok(new ApiResponse(true, "Booking cancelled successfully", booking));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse> deleteBooking(
            @PathVariable Long id,
            @RequestHeader("X-User-Id") Long managerId,
            @RequestHeader("X-User-Role") String managerRole
    ) {
        BookingResponseDTO booking = bookingService.deleteBooking(id, managerId, managerRole);
        return ResponseEntity.ok(new ApiResponse(true, "Booking deleted successfully", booking));
    }
}
