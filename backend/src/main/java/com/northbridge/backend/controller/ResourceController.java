package com.northbridge.backend.controller;

import com.northbridge.backend.dto.ApiResponse;
import com.northbridge.backend.dto.ResourceDTO;
import com.northbridge.backend.model.Resource;
import com.northbridge.backend.service.ResourceService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;

@RestController
@RequestMapping("/api/resource-manager/resources")
@CrossOrigin(origins = "http://localhost:5173")
public class ResourceController {

    @Autowired
    private ResourceService resourceService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    // 1. ADD RESOURCE - POST (FIXED VERSION)
    @PostMapping(value = "/add", consumes = {"multipart/form-data"})
    public ResponseEntity<ApiResponse> addResource(
            @RequestParam("resource") String resourceJson,
            @RequestParam(value = "image", required = false) MultipartFile imageFile) {
        try {
            System.out.println("=== DEBUGGING ADD RESOURCE ===");
            System.out.println("Received JSON: " + resourceJson);

            // Parse JSON string to ResourceDTO
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
    @GetMapping("/all")
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
    @GetMapping("/{id}")
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
    @GetMapping("/code/{resourceCode}")
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
    @GetMapping("/type/{type}")
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
    @GetMapping("/available")
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
    @GetMapping("/types")
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
    @GetMapping("/search")
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
    @GetMapping("/filter")
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

    // 10. UPDATE RESOURCE - PUT (UPDATED with image upload support)
    @PutMapping(value = "/update/{id}", consumes = {"multipart/form-data"})
    public ResponseEntity<ApiResponse> updateResource(
            @PathVariable Long id,
            @RequestParam("resource") String resourceJson,
            @RequestParam(value = "image", required = false) MultipartFile imageFile) {
        try {
            System.out.println("=== DEBUGGING UPDATE RESOURCE ===");
            System.out.println("Updating resource ID: " + id);
            System.out.println("Received JSON: " + resourceJson);

            // Parse JSON string to ResourceDTO
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
    @PutMapping("/status/{id}")
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
    @DeleteMapping("/delete/{id}")
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
    @GetMapping("/statistics")
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
}