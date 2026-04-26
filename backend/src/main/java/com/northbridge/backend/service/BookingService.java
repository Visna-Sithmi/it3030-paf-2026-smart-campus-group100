package com.northbridge.backend.service;

import com.northbridge.backend.dto.BookingRequestDTO;
import com.northbridge.backend.dto.BookingResponseDTO;
import com.northbridge.backend.dto.BookingSlotDTO;

import java.time.LocalDate;

import java.util.List;

public interface BookingService {

    BookingResponseDTO createBooking(BookingRequestDTO requestDTO, Long requesterId, String requesterRole);

    List<BookingResponseDTO> getMyBookings(Long requesterId, String requesterRole);

    List<BookingResponseDTO> getAllBookings(String requesterRole);

    BookingResponseDTO getBookingById(Long bookingId, Long requesterId, String requesterRole);

    BookingResponseDTO approveBooking(Long bookingId, Long adminId, String adminRole);

    BookingResponseDTO rejectBooking(Long bookingId, String reason, Long adminId, String adminRole);

    BookingResponseDTO cancelBooking(Long bookingId, Long requesterId, String requesterRole);

    BookingResponseDTO deleteBooking(Long bookingId, Long managerId, String managerRole);

    List<BookingSlotDTO> getBookedSlotsForResourceDate(Long resourceId, LocalDate bookingDate, Long requesterId, String requesterRole);
}
