package com.northbridge.backend.controller;

import com.northbridge.backend.dto.ManagerAnalyticsDTO;
import com.northbridge.backend.service.ManagerAnalyticsService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Locale;

@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174", "http://localhost:3000"})
@RestController
@RequestMapping("/api/manager")
public class ManagerAnalyticsController {

    private final ManagerAnalyticsService analyticsService;

    public ManagerAnalyticsController(ManagerAnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @GetMapping("/analytics")
    public ResponseEntity<?> getAnalytics() {
        return ResponseEntity.ok(analyticsService.getAnalytics());
    }
}

