// Create new file: com/northbridge/backend/repository/HolidayRepository.java
package com.northbridge.backend.repository;

import com.northbridge.backend.model.Holiday;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface HolidayRepository extends JpaRepository<Holiday, Long> {
    Optional<Holiday> findByHolidayDate(LocalDate date);

    @Query("SELECT h FROM Holiday h WHERE h.holidayDate >= CURRENT_DATE ORDER BY h.holidayDate ASC")
    List<Holiday> findUpcomingHolidays();

    boolean existsByHolidayDate(LocalDate date);

    @Query("SELECT CASE WHEN COUNT(h) > 0 THEN true ELSE false END FROM Holiday h WHERE h.holidayDate = CURRENT_DATE AND h.isClosed = true")
    boolean isTodayHoliday();
}