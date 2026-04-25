package com.northbridge.backend.service;

import com.northbridge.backend.dto.HolidayRequestDTO;
import com.northbridge.backend.model.Holiday;
import com.northbridge.backend.repository.HolidayRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class HolidayService {

    @Autowired
    private HolidayRepository holidayRepository;

    public Holiday addHoliday(HolidayRequestDTO holidayRequest) {
        // Check if holiday already exists for this date
        if (holidayRepository.existsByHolidayDate(holidayRequest.getHolidayDate())) {
            throw new RuntimeException("Holiday already exists for this date: " + holidayRequest.getHolidayDate());
        }

        Holiday holiday = new Holiday();
        holiday.setHolidayName(holidayRequest.getHolidayName());
        holiday.setHolidayDate(holidayRequest.getHolidayDate());
        holiday.setDescription(holidayRequest.getDescription());
        holiday.setClosed(true);

        return holidayRepository.save(holiday);
    }

    public List<Holiday> getAllHolidays() {
        return holidayRepository.findAll();
    }

    public List<Holiday> getUpcomingHolidays() {
        return holidayRepository.findUpcomingHolidays();
    }

    public boolean isTodayHoliday() {
        return holidayRepository.isTodayHoliday();
    }

    public void deleteHoliday(Long id) {
        Holiday holiday = holidayRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Holiday not found with ID: " + id));
        holidayRepository.delete(holiday);
    }
}