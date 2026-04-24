package com.northbridge.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.northbridge.backend.dto.ApiResponse;
import com.northbridge.backend.dto.ResourceDTO;
import com.northbridge.backend.model.Holiday;
import com.northbridge.backend.model.Resource;
import com.northbridge.backend.service.ResourceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/resource-manager")
@CrossOrigin(
        origins = "http://localhost:5173",
        allowedHeaders = "*",
        methods = {
                RequestMethod.GET,
                RequestMethod.POST,
                RequestMethod.PUT,
                RequestMethod.DELETE,
                RequestMethod.OPTIONS
        }
)
public class ResourceController {

    @Autowired
    private ResourceService resourceService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    // ==================== RESOURCE MANAGEMENT ENDPOINTS ====================

    // 1. ADD RESOURCE - POST
    @PostMapping(value = "/resources/add", consumes = {"multipart/form-data"})
    public ResponseEntity<ApiResponse> addResource(
            @RequestParam("resource") String resourceJson,
            @RequestParam(value = "image", required = false) MultipartFile imageFile) {
        try {
            System.out.println("=== DEBUGGING ADD RESOURCE ===");
            System.out.println("Received JSON: " + resourceJson);

            ResourceDTO resourceDTO = objectMapper.readValue(resourceJson, ResourceDTO.class);

            System.out.println("Resource Code: " + resourceDTO.getResourceCode());
            System.out.println("Resource Name: " + resourceDTO.getName());
            System.out.println("Resource Type: " + resourceDTO.getType());

            if (imageFile != null && !imageFile.isEmpty()) {
                System.out.println("Image file: " + imageFile.getOriginalFilename());
                System.out.println("Image size: " + imageFile.getSize() + " bytes");
                resourceDTO.setImageFile(imageFile);
            } else {
                System.out.println("No image file provided");
            }

            Resource newResource = resourceService.addResource(resourceDTO);
            System.out.println("Resource saved with ID: " + newResource.getId());

            ApiResponse response = new ApiResponse(true, "Resource added successfully", newResource);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);

        } catch (Exception e) {
            System.err.println("Error adding resource: " + e.getMessage());
            e.printStackTrace();
            ApiResponse response = new ApiResponse(false, "Error adding resource: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    // 2. GET ALL RESOURCES - GET
    @GetMapping("/resources/all")
    public ResponseEntity<ApiResponse> getAllResources() {
        try {
            List<ResourceDTO> resources = resourceService.getAllResources();
            ApiResponse response = new ApiResponse(true, "Resources retrieved successfully", resources);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            ApiResponse response = new ApiResponse(false, "Error fetching resources: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    // 3. GET RESOURCE BY ID - GET
    @GetMapping("/resources/{id}")
    public ResponseEntity<ApiResponse> getResourceById(@PathVariable Long id) {
        try {
            ResourceDTO resource = resourceService.getResourceById(id);
            ApiResponse response = new ApiResponse(true, "Resource retrieved successfully", resource);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            ApiResponse response = new ApiResponse(false, e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }
    }

    // 4. GET RESOURCE BY CODE - GET
    @GetMapping("/resources/code/{resourceCode}")
    public ResponseEntity<ApiResponse> getResourceByCode(@PathVariable String resourceCode) {
        try {
            ResourceDTO resource = resourceService.getResourceByCode(resourceCode);
            ApiResponse response = new ApiResponse(true, "Resource retrieved successfully", resource);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            ApiResponse response = new ApiResponse(false, e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }
    }

    // 5. GET RESOURCES BY TYPE - GET
    @GetMapping("/resources/type/{type}")
    public ResponseEntity<ApiResponse> getResourcesByType(@PathVariable String type) {
        try {
            List<ResourceDTO> resources = resourceService.getResourcesByType(type);
            ApiResponse response = new ApiResponse(true, "Resources retrieved successfully", resources);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            ApiResponse response = new ApiResponse(false, e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        } catch (Exception e) {
            ApiResponse response = new ApiResponse(false, "Error fetching resources: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    // 6. GET AVAILABLE RESOURCES - GET
    @GetMapping("/resources/available")
    public ResponseEntity<ApiResponse> getAvailableResources() {
        try {
            List<ResourceDTO> resources = resourceService.getAvailableResources();
            ApiResponse response = new ApiResponse(true, "Available resources retrieved successfully", resources);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            ApiResponse response = new ApiResponse(false, "Error fetching resources: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    // 7. GET ALL RESOURCE TYPES - GET
    @GetMapping("/resources/types")
    public ResponseEntity<ApiResponse> getAllResourceTypes() {
        try {
            List<String> types = resourceService.getAllResourceTypes();
            ApiResponse response = new ApiResponse(true, "Resource types retrieved successfully", types);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            ApiResponse response = new ApiResponse(false, "Error fetching resource types: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    // 8. SEARCH RESOURCES BY NAME - GET
    @GetMapping("/resources/search")
    public ResponseEntity<ApiResponse> searchResources(@RequestParam String name) {
        try {
            List<ResourceDTO> resources = resourceService.searchResourcesByName(name);
            ApiResponse response = new ApiResponse(true, "Resources retrieved successfully", resources);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            ApiResponse response = new ApiResponse(false, "Error searching resources: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    // 9. FILTER RESOURCES - GET
    @GetMapping("/resources/filter")
    public ResponseEntity<ApiResponse> filterResources(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) Integer minCapacity,
            @RequestParam(required = false) String location) {
        try {
            List<ResourceDTO> resources = resourceService.filterResources(type, minCapacity, location);
            ApiResponse response = new ApiResponse(true, "Resources filtered successfully", resources);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            ApiResponse response = new ApiResponse(false, "Error filtering resources: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    // 10. UPDATE RESOURCE - PUT
    @PutMapping(value = "/resources/update/{id}", consumes = {"multipart/form-data"})
    public ResponseEntity<ApiResponse> updateResource(
            @PathVariable Long id,
            @RequestParam("resource") String resourceJson,
            @RequestParam(value = "image", required = false) MultipartFile imageFile) {
        try {
            System.out.println("=== DEBUGGING UPDATE RESOURCE ===");
            System.out.println("Updating resource ID: " + id);
            System.out.println("Received JSON: " + resourceJson);

            ResourceDTO resourceDTO = objectMapper.readValue(resourceJson, ResourceDTO.class);

            if (imageFile != null && !imageFile.isEmpty()) {
                System.out.println("New image file: " + imageFile.getOriginalFilename());
                resourceDTO.setImageFile(imageFile);
            }

            ResourceDTO updatedResource = resourceService.updateResource(id, resourceDTO);
            ApiResponse response = new ApiResponse(true, "Resource updated successfully", updatedResource);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            System.err.println("Error updating resource: " + e.getMessage());
            e.printStackTrace();
            ApiResponse response = new ApiResponse(false, "Error updating resource: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    // 11. UPDATE RESOURCE STATUS - PUT
    @PutMapping("/resources/status/{id}")
    public ResponseEntity<ApiResponse> updateResourceStatus(@PathVariable Long id, @RequestParam String status) {
        try {
            ResourceDTO updatedResource = resourceService.updateResourceStatus(id, status);
            ApiResponse response = new ApiResponse(true, "Resource status updated successfully", updatedResource);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            ApiResponse response = new ApiResponse(false, e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    // 12. DELETE RESOURCE - DELETE
    @DeleteMapping("/resources/delete/{id}")
    public ResponseEntity<ApiResponse> deleteResource(@PathVariable Long id) {
        try {
            resourceService.deleteResource(id);
            ApiResponse response = new ApiResponse(true, "Resource deleted successfully");
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            ApiResponse response = new ApiResponse(false, e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }
    }

    // 13. GET STATISTICS - GET
    @GetMapping("/resources/statistics")
    public ResponseEntity<ApiResponse> getStatistics() {
        try {
            ResourceService.ResourceStatistics stats = resourceService.getStatistics();
            ApiResponse response = new ApiResponse(true, "Statistics retrieved successfully", stats);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            ApiResponse response = new ApiResponse(false, "Error fetching statistics: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    // ==================== HOLIDAY MANAGEMENT ENDPOINTS ====================

    // 14. ADD HOLIDAY - POST
    @PostMapping("/holidays/add")
    public ResponseEntity<ApiResponse> addHoliday(@RequestBody Map<String, Object> holidayData) {
        try {
            System.out.println("=== ADDING HOLIDAY ===");
            System.out.println("Received data: " + holidayData);

            String holidayName = (String) holidayData.get("holidayName");
            String holidayDateStr = (String) holidayData.get("holidayDate");
            String description = (String) holidayData.get("description");

            System.out.println("Holiday Name: " + holidayName);
            System.out.println("Holiday Date String: " + holidayDateStr);

            if (holidayName == null || holidayName.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(new ApiResponse(false, "Holiday name is required"));
            }
            if (holidayDateStr == null || holidayDateStr.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(new ApiResponse(false, "Holiday date is required"));
            }

            LocalDate holidayDate;
            try {
                holidayDate = LocalDate.parse(holidayDateStr);
            } catch (Exception e) {
                DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
                holidayDate = LocalDate.parse(holidayDateStr, formatter);
            }

            System.out.println("Parsed Date: " + holidayDate);

            Holiday holiday = new Holiday();
            holiday.setHolidayName(holidayName);
            holiday.setHolidayDate(holidayDate);
            holiday.setDescription(description != null ? description : "");
            holiday.setClosed(true);

            Holiday newHoliday = resourceService.addHoliday(holiday);
            System.out.println("Holiday saved with ID: " + newHoliday.getId());

            ApiResponse response = new ApiResponse(true, "Holiday added successfully", newHoliday);
            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            System.err.println("Runtime error: " + e.getMessage());
            ApiResponse response = new ApiResponse(false, e.getMessage());
            return ResponseEntity.badRequest().body(response);
        } catch (Exception e) {
            System.err.println("Unexpected error: " + e.getMessage());
            e.printStackTrace();
            ApiResponse response = new ApiResponse(false, "Error adding holiday: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    // 15. GET ALL HOLIDAYS - GET
    @GetMapping("/holidays/all")
    public ResponseEntity<ApiResponse> getAllHolidays() {
        try {
            List<Holiday> holidays = resourceService.getAllHolidays();
            ApiResponse response = new ApiResponse(true, "Holidays retrieved successfully", holidays);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            ApiResponse response = new ApiResponse(false, "Error fetching holidays: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    // 16. DELETE HOLIDAY - DELETE
    @DeleteMapping("/holidays/delete/{id}")
    public ResponseEntity<ApiResponse> deleteHoliday(@PathVariable Long id) {
        try {
            resourceService.deleteHoliday(id);
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

    // ==================== EMERGENCY LOCK ENDPOINTS ====================

    // 17. ENABLE GLOBAL LOCK - PUT
    @PutMapping("/lock/enable")
    public ResponseEntity<ApiResponse> enableGlobalLock() {
        try {
            resourceService.setGlobalLockStatus(true);
            ApiResponse response = new ApiResponse(true, "🔒 EMERGENCY LOCK: All resources have been disabled");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            ApiResponse response = new ApiResponse(false, "Error enabling lock: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    // 18. DISABLE GLOBAL LOCK - PUT
    @PutMapping("/lock/disable")
    public ResponseEntity<ApiResponse> disableGlobalLock() {
        try {
            resourceService.setGlobalLockStatus(false);
            ApiResponse response = new ApiResponse(true, "🔓 Global lock disabled: Resources are now available");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            ApiResponse response = new ApiResponse(false, "Error disabling lock: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    // 19. GET SYSTEM STATUS - GET
    @GetMapping("/system/status")
    public ResponseEntity<ApiResponse> getSystemStatus() {
        try {
            Map<String, Object> status = resourceService.getSystemStatus();
            ApiResponse response = new ApiResponse(true, "System status retrieved successfully", status);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            ApiResponse response = new ApiResponse(false, "Error fetching system status: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
}