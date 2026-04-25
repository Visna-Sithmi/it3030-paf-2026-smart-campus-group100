package com.northbridge.backend.controller;

import com.northbridge.backend.dto.ApiResponse;
import com.northbridge.backend.dto.HolidayRequestDTO;
import com.northbridge.backend.model.Holiday;
import com.northbridge.backend.service.HolidayService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/resource-manager/holidays")
@CrossOrigin(origins = "http://localhost:5173")
public class HolidayController {

    @Autowired
    private HolidayService holidayService;

    // Add a new holiday
    @PostMapping("/add")
    public ResponseEntity<ApiResponse> addHoliday(@RequestBody HolidayRequestDTO holidayRequest) {
        try {
            Holiday holiday = holidayService.addHoliday(holidayRequest);
            ApiResponse response = new ApiResponse(true, "Holiday added successfully", holiday);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (RuntimeException e) {
            ApiResponse response = new ApiResponse(false, e.getMessage());
            return ResponseEntity.badRequest().body(response);
        } catch (Exception e) {
            ApiResponse response = new ApiResponse(false, "Error adding holiday: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    // Get all holidays
    @GetMapping("/all")
    public ResponseEntity<ApiResponse> getAllHolidays() {
        try {
            List<Holiday> holidays = holidayService.getAllHolidays();
            ApiResponse response = new ApiResponse(true, "Holidays retrieved successfully", holidays);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            ApiResponse response = new ApiResponse(false, "Error fetching holidays: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    // Get upcoming holidays
    @GetMapping("/upcoming")
    public ResponseEntity<ApiResponse> getUpcomingHolidays() {
        try {
            List<Holiday> holidays = holidayService.getUpcomingHolidays();
            ApiResponse response = new ApiResponse(true, "Upcoming holidays retrieved successfully", holidays);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            ApiResponse response = new ApiResponse(false, "Error fetching upcoming holidays: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    // Check if today is holiday
    @GetMapping("/today")
    public ResponseEntity<ApiResponse> isTodayHoliday() {
        try {
            boolean isHoliday = holidayService.isTodayHoliday();
            ApiResponse response = new ApiResponse(true, "Holiday status retrieved", isHoliday);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            ApiResponse response = new ApiResponse(false, "Error checking holiday status: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    // Delete a holiday
    @DeleteMapping("/delete/{id}")
    public ResponseEntity<ApiResponse> deleteHoliday(@PathVariable Long id) {
        try {
            holidayService.deleteHoliday(id);
            ApiResponse response = new ApiResponse(true, "Holiday deleted successfully");
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            ApiResponse response = new ApiResponse(false, e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        } catch (Exception e) {
            ApiResponse response = new ApiResponse(false, "Error deleting holiday: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
}