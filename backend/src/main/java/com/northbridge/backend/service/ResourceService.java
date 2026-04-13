package com.northbridge.backend.service;

import com.northbridge.backend.dto.ResourceDTO;
import com.northbridge.backend.model.Resource;
import com.northbridge.backend.repository.ResourceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ResourceService {

    @Autowired
    private ResourceRepository resourceRepository;

    // Valid resource types
    private static final List<String> VALID_RESOURCE_TYPES = Arrays.asList(
            "LECTURE_HALL", "LAB", "MEETING_ROOM", "PROJECTOR",
            "CAMERA", "AUDIO_SYSTEM", "COMPUTER", "WHITEBOARD",
            "FURNITURE", "OTHER"
    );

    // CREATE - Add new resource
    public Resource addResource(ResourceDTO resourceDTO) {
        // Check if resource code already exists
        if (resourceRepository.existsByResourceCode(resourceDTO.getResourceCode())) {
            throw new RuntimeException("Resource code already exists: " + resourceDTO.getResourceCode());
        }

        // Validate resource type
        if (resourceDTO.getType() != null && !isValidType(resourceDTO.getType())) {
            throw new RuntimeException("Invalid resource type: " + resourceDTO.getType() +
                    ". Valid types are: " + String.join(", ", VALID_RESOURCE_TYPES));
        }

        Resource resource = new Resource();
        resource.setResourceCode(resourceDTO.getResourceCode());
        resource.setName(resourceDTO.getName());
        resource.setType(resourceDTO.getType());
        resource.setCapacity(resourceDTO.getCapacity());
        resource.setLocation(resourceDTO.getLocation());
        resource.setDescription(resourceDTO.getDescription());
        resource.setAvailabilityWindows(resourceDTO.getAvailabilityWindows());
        resource.setStatus(resourceDTO.getStatus() != null ? resourceDTO.getStatus() : "ACTIVE");
        resource.setAvailable(resourceDTO.isAvailable());
        resource.setImageUrl(resourceDTO.getImageUrl());
        resource.setDailyRate(resourceDTO.getDailyRate());
        resource.setCreatedBy(resourceDTO.getCreatedBy());

        return resourceRepository.save(resource);
    }

    // READ - Get all resources
    public List<ResourceDTO> getAllResources() {
        List<Resource> resources = resourceRepository.findAll();
        return resources.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    // READ - Get resource by ID
    public ResourceDTO getResourceById(Long id) {
        Resource resource = resourceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Resource not found with ID: " + id));
        return convertToDTO(resource);
    }

    // READ - Get resource by Resource Code
    public ResourceDTO getResourceByCode(String resourceCode) {
        Resource resource = resourceRepository.findByResourceCode(resourceCode)
                .orElseThrow(() -> new RuntimeException("Resource not found with Code: " + resourceCode));
        return convertToDTO(resource);
    }

    // READ - Get resources by type
    public List<ResourceDTO> getResourcesByType(String type) {
        if (!isValidType(type)) {
            throw new RuntimeException("Invalid resource type: " + type);
        }
        List<Resource> resources = resourceRepository.findByType(type);
        return resources.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    // READ - Get available resources only
    public List<ResourceDTO> getAvailableResources() {
        List<Resource> resources = resourceRepository.findByIsAvailableTrue();
        return resources.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    // READ - Search resources by name
    public List<ResourceDTO> searchResourcesByName(String name) {
        List<Resource> resources = resourceRepository.searchByName(name);
        return resources.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    // READ - Get all distinct resource types
    public List<String> getAllResourceTypes() {
        return resourceRepository.findAllDistinctTypes();
    }

    // READ - Filter resources
    public List<ResourceDTO> filterResources(String type, Integer minCapacity, String location) {
        List<Resource> resources;

        if (type != null && minCapacity != null) {
            resources = resourceRepository.findByTypeAndMinCapacity(type, minCapacity);
        } else if (type != null && location != null) {
            resources = resourceRepository.findByLocationAndType(location, type);
        } else if (type != null) {
            resources = resourceRepository.findByType(type);
        } else if (location != null) {
            resources = resourceRepository.findByLocationContainingIgnoreCase(location);
        } else {
            resources = resourceRepository.findAll();
        }

        return resources.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    // UPDATE - Update resource
    public ResourceDTO updateResource(Long id, ResourceDTO resourceDTO) {
        Resource resource = resourceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Resource not found with ID: " + id));

        if (resourceDTO.getName() != null) resource.setName(resourceDTO.getName());
        if (resourceDTO.getType() != null) {
            if (!isValidType(resourceDTO.getType())) {
                throw new RuntimeException("Invalid resource type: " + resourceDTO.getType());
            }
            resource.setType(resourceDTO.getType());
        }
        if (resourceDTO.getCapacity() != null) resource.setCapacity(resourceDTO.getCapacity());
        if (resourceDTO.getLocation() != null) resource.setLocation(resourceDTO.getLocation());
        if (resourceDTO.getDescription() != null) resource.setDescription(resourceDTO.getDescription());
        if (resourceDTO.getAvailabilityWindows() != null) resource.setAvailabilityWindows(resourceDTO.getAvailabilityWindows());
        if (resourceDTO.getStatus() != null) resource.setStatus(resourceDTO.getStatus());
        resource.setAvailable(resourceDTO.isAvailable());
        if (resourceDTO.getImageUrl() != null) resource.setImageUrl(resourceDTO.getImageUrl());
        if (resourceDTO.getDailyRate() != null) resource.setDailyRate(resourceDTO.getDailyRate());

        resource.setUpdatedAt(LocalDateTime.now());

        Resource updatedResource = resourceRepository.save(resource);
        return convertToDTO(updatedResource);
    }

    // UPDATE - Change resource status
    public ResourceDTO updateResourceStatus(Long id, String status) {
        Resource resource = resourceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Resource not found with ID: " + id));

        List<String> validStatuses = Arrays.asList("ACTIVE", "OUT_OF_SERVICE", "MAINTENANCE");
        if (!validStatuses.contains(status)) {
            throw new RuntimeException("Invalid status. Valid statuses: ACTIVE, OUT_OF_SERVICE, MAINTENANCE");
        }

        resource.setStatus(status);
        resource.setAvailable("ACTIVE".equals(status));
        resource.setUpdatedAt(LocalDateTime.now());

        Resource updatedResource = resourceRepository.save(resource);
        return convertToDTO(updatedResource);
    }

    // DELETE - Hard delete resource
    public void deleteResource(Long id) {
        Resource resource = resourceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Resource not found with ID: " + id));
        resourceRepository.delete(resource);
    }

    // GET - Statistics
    public ResourceStatistics getStatistics() {
        ResourceStatistics stats = new ResourceStatistics();
        stats.setTotalResources(resourceRepository.count());
        stats.setActiveResources(resourceRepository.countByStatus("ACTIVE"));
        stats.setOutOfServiceResources(resourceRepository.countByStatus("OUT_OF_SERVICE"));
        stats.setMaintenanceResources(resourceRepository.countByStatus("MAINTENANCE"));
        stats.setAvailableResources(resourceRepository.findByIsAvailableTrue().size());

        // Count by type
        List<Object[]> typeCounts = resourceRepository.countByType();
        Map<String, Long> typeCountMap = new HashMap<>();
        for (Object[] typeCount : typeCounts) {
            typeCountMap.put((String) typeCount[0], (Long) typeCount[1]);
        }
        stats.setTypeCounts(typeCountMap);

        return stats;
    }

    // Helper method to validate resource type
    private boolean isValidType(String type) {
        return VALID_RESOURCE_TYPES.contains(type);
    }

    // Convert to DTO
    private ResourceDTO convertToDTO(Resource resource) {
        ResourceDTO dto = new ResourceDTO();
        dto.setId(resource.getId());
        dto.setResourceCode(resource.getResourceCode());
        dto.setName(resource.getName());
        dto.setType(resource.getType());
        dto.setCapacity(resource.getCapacity());
        dto.setLocation(resource.getLocation());
        dto.setDescription(resource.getDescription());
        dto.setAvailabilityWindows(resource.getAvailabilityWindows());
        dto.setStatus(resource.getStatus());
        dto.setAvailable(resource.isAvailable());
        dto.setImageUrl(resource.getImageUrl());
        dto.setDailyRate(resource.getDailyRate());
        dto.setCreatedBy(resource.getCreatedBy());
        return dto;
    }

    // Statistics Inner Class
    public static class ResourceStatistics {
        private long totalResources;
        private long activeResources;
        private long outOfServiceResources;
        private long maintenanceResources;
        private long availableResources;
        private Map<String, Long> typeCounts = new HashMap<>();

        public long getTotalResources() { return totalResources; }
        public void setTotalResources(long totalResources) { this.totalResources = totalResources; }

        public long getActiveResources() { return activeResources; }
        public void setActiveResources(long activeResources) { this.activeResources = activeResources; }

        public long getOutOfServiceResources() { return outOfServiceResources; }
        public void setOutOfServiceResources(long outOfServiceResources) { this.outOfServiceResources = outOfServiceResources; }

        public long getMaintenanceResources() { return maintenanceResources; }
        public void setMaintenanceResources(long maintenanceResources) { this.maintenanceResources = maintenanceResources; }

        public long getAvailableResources() { return availableResources; }
        public void setAvailableResources(long availableResources) { this.availableResources = availableResources; }

        public Map<String, Long> getTypeCounts() { return typeCounts; }
        public void setTypeCounts(Map<String, Long> typeCounts) { this.typeCounts = typeCounts; }
    }
}