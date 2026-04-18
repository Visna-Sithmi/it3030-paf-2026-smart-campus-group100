package com.northbridge.backend.repository;

import com.northbridge.backend.model.Booking;
import com.northbridge.backend.model.BookingStatus;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Collection;
import java.util.List;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {

    List<Booking> findByRequestedByIdOrderByCreatedAtDesc(Long requestedById);

        boolean existsByRequestedById(Long requestedById);

        @Modifying
        @Query("UPDATE Booking b SET b.approvedOrRejectedBy = NULL, b.decisionAt = NULL WHERE b.approvedOrRejectedBy.id = :userId")
        int clearApproverReferences(@Param("userId") Long userId);

    List<Booking> findAllByOrderByCreatedAtDesc();

    List<Booking> findByStatusOrderByCreatedAtDesc(BookingStatus status);

    List<Booking> findByResourceIdAndBookingDateAndStatusInOrderByStartTimeAsc(
            Long resourceId,
            LocalDate bookingDate,
            Collection<BookingStatus> statuses
    );

    @Query("""
            SELECT CASE WHEN COUNT(b) > 0 THEN true ELSE false END
            FROM Booking b
            WHERE b.resource.id = :resourceId
              AND b.bookingDate = :bookingDate
              AND b.status IN :statuses
              AND :newStart < b.endTime
              AND :newEnd > b.startTime
            """)
    boolean existsOverlappingBooking(
            @Param("resourceId") Long resourceId,
            @Param("bookingDate") LocalDate bookingDate,
            @Param("newStart") LocalTime newStart,
            @Param("newEnd") LocalTime newEnd,
            @Param("statuses") Collection<BookingStatus> statuses
    );

    @Query("""
            SELECT CASE WHEN COUNT(b) > 0 THEN true ELSE false END
            FROM Booking b
            WHERE b.resource.id = :resourceId
              AND b.bookingDate = :bookingDate
              AND b.status = :status
              AND b.bookingId <> :bookingId
              AND :newStart < b.endTime
              AND :newEnd > b.startTime
            """)
    boolean existsOverlappingBookingExcludingCurrent(
            @Param("resourceId") Long resourceId,
            @Param("bookingDate") LocalDate bookingDate,
            @Param("newStart") LocalTime newStart,
            @Param("newEnd") LocalTime newEnd,
            @Param("status") BookingStatus status,
            @Param("bookingId") Long bookingId
    );
}
