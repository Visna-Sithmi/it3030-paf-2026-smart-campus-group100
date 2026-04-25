package com.northbridge.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.northbridge.backend.dto.ApiResponse;
import com.northbridge.backend.dto.ResourceDTO;
import com.northbridge.backend.model.Resource;
import com.northbridge.backend.service.ResourceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

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

    @PostMapping(value = "/resources/add", consumes = {"multipart/form-data"})
    public ResponseEntity<ApiResponse> addResource(
            @RequestParam("resource") String resourceJson,
            @RequestParam(value = "image", required = false) MultipartFile imageFile) {
        try {
            System.out.println("=== ADD RESOURCE ===");
            ResourceDTO resourceDTO = objectMapper.readValue(resourceJson, ResourceDTO.class);
            if (imageFile != null && !imageFile.isEmpty()) {
                resourceDTO.setImageFile(imageFile);
            }
            Resource newResource = resourceService.addResource(resourceDTO);
            return ResponseEntity.status(HttpStatus.CREATED).body(new ApiResponse(true, "Resource added successfully", newResource));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, "Error adding resource: " + e.getMessage()));
        }
    }

    @GetMapping("/resources/all")
    public ResponseEntity<ApiResponse> getAllResources() {
        try {
            List<ResourceDTO> resources = resourceService.getAllResources();
            return ResponseEntity.ok(new ApiResponse(true, "Resources retrieved successfully", resources));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new ApiResponse(false, "Error fetching resources: " + e.getMessage()));
        }
    }

    @GetMapping("/resources/{id}")
    public ResponseEntity<ApiResponse> getResourceById(@PathVariable Long id) {
        try {
            ResourceDTO resource = resourceService.getResourceById(id);
            return ResponseEntity.ok(new ApiResponse(true, "Resource retrieved successfully", resource));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ApiResponse(false, e.getMessage()));
        }
    }

    @GetMapping("/resources/code/{resourceCode}")
    public ResponseEntity<ApiResponse> getResourceByCode(@PathVariable String resourceCode) {
        try {
            ResourceDTO resource = resourceService.getResourceByCode(resourceCode);
            return ResponseEntity.ok(new ApiResponse(true, "Resource retrieved successfully", resource));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ApiResponse(false, e.getMessage()));
        }
    }

    @GetMapping("/resources/type/{type}")
    public ResponseEntity<ApiResponse> getResourcesByType(@PathVariable String type) {
        try {
            List<ResourceDTO> resources = resourceService.getResourcesByType(type);
            return ResponseEntity.ok(new ApiResponse(true, "Resources retrieved successfully", resources));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        }
    }

    @GetMapping("/resources/available")
    public ResponseEntity<ApiResponse> getAvailableResources() {
        try {
            List<ResourceDTO> resources = resourceService.getAvailableResources();
            return ResponseEntity.ok(new ApiResponse(true, "Available resources retrieved successfully", resources));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new ApiResponse(false, "Error fetching resources: " + e.getMessage()));
        }
    }

    @GetMapping("/resources/client/{audience}")
    public ResponseEntity<ApiResponse> getResourcesForAudience(@PathVariable String audience) {
        try {
            List<ResourceDTO> resources = resourceService.getResourcesForAudience(audience);
            return ResponseEntity.ok(new ApiResponse(true, "Audience resources retrieved successfully", resources));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        }
    }

    @GetMapping("/resources/types")
    public ResponseEntity<ApiResponse> getAllResourceTypes() {
        try {
            List<String> types = resourceService.getAllResourceTypes();
            return ResponseEntity.ok(new ApiResponse(true, "Resource types retrieved successfully", types));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new ApiResponse(false, "Error fetching resource types: " + e.getMessage()));
        }
    }

    @GetMapping("/resources/search")
    public ResponseEntity<ApiResponse> searchResources(@RequestParam String name) {
        try {
            List<ResourceDTO> resources = resourceService.searchResourcesByName(name);
            return ResponseEntity.ok(new ApiResponse(true, "Resources retrieved successfully", resources));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new ApiResponse(false, "Error searching resources: " + e.getMessage()));
        }
    }

    @GetMapping("/resources/filter")
    public ResponseEntity<ApiResponse> filterResources(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) Integer minCapacity,
            @RequestParam(required = false) String location) {
        try {
            List<ResourceDTO> resources = resourceService.filterResources(type, minCapacity, location);
            return ResponseEntity.ok(new ApiResponse(true, "Resources filtered successfully", resources));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new ApiResponse(false, "Error filtering resources: " + e.getMessage()));
        }
    }

    @PutMapping(value = "/resources/update/{id}", consumes = {"multipart/form-data"})
    public ResponseEntity<ApiResponse> updateResource(
            @PathVariable Long id,
            @RequestParam("resource") String resourceJson,
            @RequestParam(value = "image", required = false) MultipartFile imageFile) {
        try {
            ResourceDTO resourceDTO = objectMapper.readValue(resourceJson, ResourceDTO.class);
            if (imageFile != null && !imageFile.isEmpty()) {
                resourceDTO.setImageFile(imageFile);
            }
            ResourceDTO updatedResource = resourceService.updateResource(id, resourceDTO);
            return ResponseEntity.ok(new ApiResponse(true, "Resource updated successfully", updatedResource));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, "Error updating resource: " + e.getMessage()));
        }
    }

    @PutMapping("/resources/status/{id}")
    public ResponseEntity<ApiResponse> updateResourceStatus(@PathVariable Long id, @RequestParam String status) {
        try {
            ResourceDTO updatedResource = resourceService.updateResourceStatus(id, status);
            return ResponseEntity.ok(new ApiResponse(true, "Resource status updated successfully", updatedResource));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        }
    }

    @DeleteMapping("/resources/delete/{id}")
    public ResponseEntity<ApiResponse> deleteResource(@PathVariable Long id) {
        try {
            resourceService.deleteResource(id);
            return ResponseEntity.ok(new ApiResponse(true, "Resource deleted successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ApiResponse(false, e.getMessage()));
        }
    }

    @GetMapping("/resources/statistics")
    public ResponseEntity<ApiResponse> getStatistics() {
        try {
            ResourceService.ResourceStatistics stats = resourceService.getStatistics();
            return ResponseEntity.ok(new ApiResponse(true, "Statistics retrieved successfully", stats));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new ApiResponse(false, "Error fetching statistics: " + e.getMessage()));
        }
    }

    // ==================== EMERGENCY LOCK ENDPOINTS ====================

    @PutMapping("/lock/enable")
    public ResponseEntity<ApiResponse> enableGlobalLock() {
        try {
            resourceService.setGlobalLockStatus(true);
            return ResponseEntity.ok(new ApiResponse(true, "🔒 EMERGENCY LOCK: All resources have been disabled"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new ApiResponse(false, "Error enabling lock: " + e.getMessage()));
        }
    }

    @PutMapping("/lock/disable")
    public ResponseEntity<ApiResponse> disableGlobalLock() {
        try {
            resourceService.setGlobalLockStatus(false);
            return ResponseEntity.ok(new ApiResponse(true, "🔓 Global lock disabled: Resources are now available"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new ApiResponse(false, "Error disabling lock: " + e.getMessage()));
        }
    }

    @GetMapping("/system/status")
    public ResponseEntity<ApiResponse> getSystemStatus() {
        try {
            Map<String, Object> status = resourceService.getSystemStatus();
            return ResponseEntity.ok(new ApiResponse(true, "System status retrieved successfully", status));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new ApiResponse(false, "Error fetching system status: " + e.getMessage()));
        }
    }
}