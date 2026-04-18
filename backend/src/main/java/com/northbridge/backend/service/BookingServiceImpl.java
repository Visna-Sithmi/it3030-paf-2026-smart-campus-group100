package com.northbridge.backend.service;

import com.northbridge.backend.dto.BookingRequestDTO;
import com.northbridge.backend.dto.BookingResponseDTO;
import com.northbridge.backend.exception.BookingConflictException;
import com.northbridge.backend.model.Booking;
import com.northbridge.backend.model.BookingStatus;
import com.northbridge.backend.model.Resource;
import com.northbridge.backend.model.User;
import com.northbridge.backend.repository.BookingRepository;
import com.northbridge.backend.repository.ResourceRepository;
import com.northbridge.backend.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Transactional
public class BookingServiceImpl implements BookingService {

    private static final Set<String> BOOKING_CREATOR_ROLES = Set.of("STUDENT", "LECTURER");
    private static final Set<String> BOOKING_VIEWER_ROLES = Set.of("BOOKING_MANAGER");

    private final BookingRepository bookingRepository;
    private final ResourceRepository resourceRepository;
    private final UserRepository userRepository;

    public BookingServiceImpl(
            BookingRepository bookingRepository,
            ResourceRepository resourceRepository,
            UserRepository userRepository
    ) {
        this.bookingRepository = bookingRepository;
        this.resourceRepository = resourceRepository;
        this.userRepository = userRepository;
    }

    @Override
    public BookingResponseDTO createBooking(BookingRequestDTO requestDTO, Long requesterId, String requesterRole) {
        validateRequester(requesterId, requesterRole);

        String normalizedRole = normalizeRole(requesterRole);
        if (!BOOKING_CREATOR_ROLES.contains(normalizedRole)) {
            throw new SecurityException("Only STUDENT and LECTURER can create booking requests");
        }

        validateTimeRange(requestDTO.getStartTime(), requestDTO.getEndTime());

        Long resourceId = Objects.requireNonNull(requestDTO.getResourceId(), "resourceId is required");
        Resource resource = resourceRepository.findById(resourceId)
                .orElseThrow(() -> new NoSuchElementException("Resource not found with ID: " + requestDTO.getResourceId()));

        if (!resource.isAvailable() || !"ACTIVE".equalsIgnoreCase(resource.getStatus())) {
            throw new IllegalArgumentException("Resource is not available for booking");
        }

        if (resource.getCapacity() != null && requestDTO.getExpectedAttendees() > resource.getCapacity()) {
            throw new IllegalArgumentException("Expected attendees exceed resource capacity");
        }

        boolean hasOverlap = bookingRepository.existsOverlappingBooking(
                resource.getId(),
                requestDTO.getBookingDate(),
                requestDTO.getStartTime(),
                requestDTO.getEndTime(),
                List.of(BookingStatus.PENDING, BookingStatus.APPROVED)
        );

        // Overlap rule: newStart < existingEnd AND newEnd > existingStart
        if (hasOverlap) {
            throw new BookingConflictException("Booking time overlaps with an existing booking for this resource");
        }

        Long safeRequesterId = Objects.requireNonNull(requesterId, "User ID is required");
        User requester = userRepository.findById(safeRequesterId)
                .orElseThrow(() -> new NoSuchElementException("User not found with ID: " + requesterId));

        Booking booking = new Booking();
        booking.setResource(resource);
        booking.setRequestedBy(requester);
        booking.setBookingDate(requestDTO.getBookingDate());
        booking.setStartTime(requestDTO.getStartTime());
        booking.setEndTime(requestDTO.getEndTime());
        booking.setPurpose(requestDTO.getPurpose());
        booking.setExpectedAttendees(requestDTO.getExpectedAttendees());
        booking.setStatus(BookingStatus.PENDING);

        return toResponse(bookingRepository.save(booking));
    }

    @Override
    @Transactional(readOnly = true)
    public List<BookingResponseDTO> getMyBookings(Long requesterId) {
        if (requesterId == null) {
            throw new IllegalArgumentException("User ID is required");
        }

        return bookingRepository.findByRequestedByIdOrderByCreatedAtDesc(requesterId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<BookingResponseDTO> getAllBookings(String requesterRole) {
        if (!BOOKING_VIEWER_ROLES.contains(normalizeRole(requesterRole))) {
            throw new SecurityException("Only BOOKING_MANAGER can view all bookings");
        }

        return bookingRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public BookingResponseDTO getBookingById(Long bookingId, Long requesterId, String requesterRole) {
        validateRequester(requesterId, requesterRole);

        Booking booking = findBookingOrThrow(bookingId);
        boolean isBookingManager = "BOOKING_MANAGER".equals(normalizeRole(requesterRole));
        boolean isOwner = booking.getRequestedBy().getId().equals(requesterId);

        if (!isBookingManager && !isOwner) {
            throw new SecurityException("Only booking owner or BOOKING_MANAGER can view this booking");
        }

        return toResponse(booking);
    }

    @Override
    public BookingResponseDTO approveBooking(Long bookingId, Long managerId, String managerRole) {
        validateBookingManager(managerId, managerRole);

        Booking booking = findBookingOrThrow(bookingId);
        ensurePending(booking);

        boolean conflictOnApprove = bookingRepository.existsOverlappingBookingExcludingCurrent(
                booking.getResource().getId(),
                booking.getBookingDate(),
                booking.getStartTime(),
                booking.getEndTime(),
                BookingStatus.APPROVED,
                booking.getBookingId()
        );

        if (conflictOnApprove) {
            throw new BookingConflictException("Cannot approve booking because it conflicts with an already approved booking");
        }

        Long safeManagerId = Objects.requireNonNull(managerId, "Booking manager ID is required");
        User bookingManager = userRepository.findById(safeManagerId)
            .orElseThrow(() -> new NoSuchElementException("Booking manager not found with ID: " + managerId));

        booking.setStatus(BookingStatus.APPROVED);
        booking.setAdminReason(null);
        booking.setApprovedOrRejectedBy(bookingManager);
        booking.setDecisionAt(LocalDateTime.now());

        return toResponse(bookingRepository.save(booking));
    }

    @Override
    public BookingResponseDTO rejectBooking(Long bookingId, String reason, Long managerId, String managerRole) {
        validateBookingManager(managerId, managerRole);

        if (reason == null || reason.isBlank()) {
            throw new IllegalArgumentException("Rejection reason is required");
        }

        Booking booking = findBookingOrThrow(bookingId);
        ensurePending(booking);

        Long safeManagerId = Objects.requireNonNull(managerId, "Booking manager ID is required");
        User bookingManager = userRepository.findById(safeManagerId)
            .orElseThrow(() -> new NoSuchElementException("Booking manager not found with ID: " + managerId));

        booking.setStatus(BookingStatus.REJECTED);
        booking.setAdminReason(reason.trim());
        booking.setApprovedOrRejectedBy(bookingManager);
        booking.setDecisionAt(LocalDateTime.now());

        return toResponse(bookingRepository.save(booking));
    }

    @Override
    public BookingResponseDTO cancelBooking(Long bookingId, Long requesterId, String requesterRole) {
        validateRequester(requesterId, requesterRole);

        Booking booking = findBookingOrThrow(bookingId);
        boolean isOwner = booking.getRequestedBy().getId().equals(requesterId);

        // Current rule: only booking owner can cancel. Admin override can be added later.
        if (!isOwner) {
            throw new SecurityException("Only booking owner can cancel this booking");
        }

        if (booking.getStatus() == BookingStatus.CANCELLED) {
            throw new IllegalArgumentException("Booking is already cancelled");
        }

        if (booking.getStatus() == BookingStatus.REJECTED) {
            throw new IllegalArgumentException("Rejected booking cannot be cancelled");
        }

        booking.setStatus(BookingStatus.CANCELLED);
        return toResponse(bookingRepository.save(booking));
    }

    private Booking findBookingOrThrow(Long bookingId) {
        Long safeBookingId = Objects.requireNonNull(bookingId, "Booking ID is required");
        return bookingRepository.findById(safeBookingId)
                .orElseThrow(() -> new NoSuchElementException("Booking not found with ID: " + bookingId));
    }

    private void ensurePending(Booking booking) {
        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new IllegalArgumentException("Only PENDING bookings can be approved or rejected");
        }
    }

    private void validateTimeRange(java.time.LocalTime startTime, java.time.LocalTime endTime) {
        if (startTime == null || endTime == null) {
            throw new IllegalArgumentException("Start time and end time are required");
        }

        if (!endTime.isAfter(startTime)) {
            throw new IllegalArgumentException("End time must be after start time");
        }
    }

    private void validateRequester(Long userId, String role) {
        if (userId == null) {
            throw new IllegalArgumentException("User ID is required");
        }
        if (role == null || role.isBlank()) {
            throw new IllegalArgumentException("User role is required");
        }
    }

    private void validateBookingManager(Long managerId, String managerRole) {
        validateRequester(managerId, managerRole);
        if (!"BOOKING_MANAGER".equals(normalizeRole(managerRole))) {
            throw new SecurityException("Only BOOKING_MANAGER can perform this action");
        }
    }

    private String normalizeRole(String role) {
        return role == null ? "" : role.trim().toUpperCase();
    }

    private BookingResponseDTO toResponse(Booking booking) {
        BookingResponseDTO dto = new BookingResponseDTO();
        dto.setBookingId(booking.getBookingId());

        if (booking.getResource() != null) {
            dto.setResourceId(booking.getResource().getId());
            dto.setResourceName(booking.getResource().getName());
            dto.setResourceCode(booking.getResource().getResourceCode());
        }

        if (booking.getRequestedBy() != null) {
            dto.setRequestedById(booking.getRequestedBy().getId());
            dto.setRequestedByName(booking.getRequestedBy().getName());
            dto.setRequestedByRole(booking.getRequestedBy().getRole());
        }

        dto.setBookingDate(booking.getBookingDate());
        dto.setStartTime(booking.getStartTime());
        dto.setEndTime(booking.getEndTime());
        dto.setPurpose(booking.getPurpose());
        dto.setExpectedAttendees(booking.getExpectedAttendees());
        dto.setStatus(booking.getStatus());
        dto.setAdminReason(booking.getAdminReason());

        if (booking.getApprovedOrRejectedBy() != null) {
            dto.setApprovedOrRejectedById(booking.getApprovedOrRejectedBy().getId());
            dto.setApprovedOrRejectedByName(booking.getApprovedOrRejectedBy().getName());
        }

        dto.setDecisionAt(booking.getDecisionAt());
        dto.setCreatedAt(booking.getCreatedAt());
        dto.setUpdatedAt(booking.getUpdatedAt());

        return dto;
    }
}
