package com.northbridge.backend.service;

import com.northbridge.backend.dto.ResourceDTO;
import com.northbridge.backend.model.Holiday;
import com.northbridge.backend.model.Resource;
import com.northbridge.backend.model.SystemSetting;
import com.northbridge.backend.repository.HolidayRepository;
import com.northbridge.backend.repository.ResourceRepository;
import com.northbridge.backend.repository.SystemSettingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ResourceService {

    @Autowired
    private ResourceRepository resourceRepository;

    @Autowired
    private HolidayRepository holidayRepository;

    @Autowired
    private SystemSettingRepository systemSettingRepository;

    @Value("${image.upload.directory:uploads/resources}")
    private String uploadDirectory;

    private static final List<String> VALID_RESOURCE_TYPES = Arrays.asList(
            "LECTURE_HALL",
            "LAB",
            "MEETING_ROOM",
            "DISCUSSION_ROOM",
            "SPORTS_FACILITY",
            "EQUIPMENT",
            "LIBRARY_SPACE",
            "AUDITORIUM",
            "OTHER"
    );

    // ==================== HELPER METHODS ====================

    private boolean isGloballyLocked() {
        try {
            String lockStatus = systemSettingRepository.getGlobalLockStatus();
            return "true".equalsIgnoreCase(lockStatus);
        } catch (Exception e) {
            return false;
        }
    }

    private boolean isHoliday() {
        return holidayRepository.isTodayHoliday();
    }

    // ==================== RESOURCE CRUD METHODS ====================

    public Resource addResource(ResourceDTO resourceDTO) {
        if (resourceRepository.existsByResourceCode(resourceDTO.getResourceCode())) {
            throw new RuntimeException("Resource code already exists: " + resourceDTO.getResourceCode());
        }

        if (resourceDTO.getType() != null && !isValidType(resourceDTO.getType())) {
            throw new RuntimeException("Invalid resource type: " + resourceDTO.getType() +
                    ". Valid types are: " + String.join(", ", VALID_RESOURCE_TYPES));
        }

        String imageUrl = null;
        if (resourceDTO.getImageFile() != null && !resourceDTO.getImageFile().isEmpty()) {
            try {
                imageUrl = saveImage(resourceDTO.getImageFile());
                resourceDTO.setImageUrl(imageUrl);
            } catch (IOException e) {
                throw new RuntimeException("Failed to save image: " + e.getMessage());
            }
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
        resource.setImageUrl(imageUrl != null ? imageUrl : resourceDTO.getImageUrl());
        resource.setDailyRate(resourceDTO.getDailyRate() != null ? resourceDTO.getDailyRate() : 0.0);
        resource.setCreatedBy(resourceDTO.getCreatedBy());

        return resourceRepository.save(resource);
    }

    // UPDATED: getAllResources with OUT_OF_SERVICE status for lock/holiday
    public List<ResourceDTO> getAllResources() {
        List<Resource> resources = resourceRepository.findAll();

        // Priority 1: Emergency Global Lock - Set to OUT_OF_SERVICE
        if (isGloballyLocked()) {
            return resources.stream()
                    .map(resource -> {
                        ResourceDTO dto = convertToDTO(resource);
                        dto.setAvailable(false);
                        dto.setStatus("OUT_OF_SERVICE");
                        return dto;
                    })
                    .collect(Collectors.toList());
        }

        // Priority 2: Holiday Closure - Set to OUT_OF_SERVICE
        if (isHoliday()) {
            return resources.stream()
                    .map(resource -> {
                        ResourceDTO dto = convertToDTO(resource);
                        dto.setAvailable(false);
                        dto.setStatus("OUT_OF_SERVICE");
                        return dto;
                    })
                    .collect(Collectors.toList());
        }

        // Priority 3: Normal individual resource status
        return resources.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public ResourceDTO getResourceById(Long id) {
        Resource resource = resourceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Resource not found with ID: " + id));
        ResourceDTO dto = convertToDTO(resource);

        // Apply global lock or holiday override - Set to OUT_OF_SERVICE
        if (isGloballyLocked() || isHoliday()) {
            dto.setAvailable(false);
            dto.setStatus("OUT_OF_SERVICE");
        }
        return dto;
    }

    public ResourceDTO getResourceByCode(String resourceCode) {
        Resource resource = resourceRepository.findByResourceCode(resourceCode)
                .orElseThrow(() -> new RuntimeException("Resource not found with Code: " + resourceCode));
        ResourceDTO dto = convertToDTO(resource);

        // Apply global lock or holiday override - Set to OUT_OF_SERVICE
        if (isGloballyLocked() || isHoliday()) {
            dto.setAvailable(false);
            dto.setStatus("OUT_OF_SERVICE");
        }
        return dto;
    }

    public List<ResourceDTO> getResourcesByType(String type) {
        if (!isValidType(type)) {
            throw new RuntimeException("Invalid resource type: " + type);
        }

        List<Resource> resources = resourceRepository.findByType(type);

        // Apply global lock or holiday override - Set to OUT_OF_SERVICE
        if (isGloballyLocked() || isHoliday()) {
            return resources.stream()
                    .map(resource -> {
                        ResourceDTO dto = convertToDTO(resource);
                        dto.setAvailable(false);
                        dto.setStatus("OUT_OF_SERVICE");
                        return dto;
                    })
                    .collect(Collectors.toList());
        }

        return resources.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<ResourceDTO> getAvailableResources() {
        // If globally locked or holiday, no resources are available
        if (isGloballyLocked() || isHoliday()) {
            return List.of();
        }

        List<Resource> resources = resourceRepository.findByIsAvailableTrue();
        return resources.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<ResourceDTO> searchResourcesByName(String name) {
        List<Resource> resources = resourceRepository.searchByName(name);

        // Apply global lock or holiday override - Set to OUT_OF_SERVICE
        if (isGloballyLocked() || isHoliday()) {
            return resources.stream()
                    .map(resource -> {
                        ResourceDTO dto = convertToDTO(resource);
                        dto.setAvailable(false);
                        dto.setStatus("OUT_OF_SERVICE");
                        return dto;
                    })
                    .collect(Collectors.toList());
        }

        return resources.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<String> getAllResourceTypes() {
        return resourceRepository.findAllDistinctTypes();
    }

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

        // Apply global lock or holiday override - Set to OUT_OF_SERVICE
        if (isGloballyLocked() || isHoliday()) {
            return resources.stream()
                    .map(resource -> {
                        ResourceDTO dto = convertToDTO(resource);
                        dto.setAvailable(false);
                        dto.setStatus("OUT_OF_SERVICE");
                        return dto;
                    })
                    .collect(Collectors.toList());
        }

        return resources.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public ResourceDTO updateResource(Long id, ResourceDTO resourceDTO) {
        Resource resource = resourceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Resource not found with ID: " + id));

        if (resourceDTO.getImageFile() != null && !resourceDTO.getImageFile().isEmpty()) {
            try {
                if (resource.getImageUrl() != null && !resource.getImageUrl().isEmpty()) {
                    deleteOldImage(resource.getImageUrl());
                }

                String imageUrl = saveImage(resourceDTO.getImageFile());
                resource.setImageUrl(imageUrl);
            } catch (IOException e) {
                throw new RuntimeException("Failed to save image: " + e.getMessage());
            }
        } else if (resourceDTO.getImageUrl() != null && !resourceDTO.getImageUrl().isBlank()) {
            resource.setImageUrl(resourceDTO.getImageUrl());
        }

        if (resourceDTO.getResourceCode() != null && !resourceDTO.getResourceCode().isBlank()) {
            String newCode = resourceDTO.getResourceCode().trim();

            if (!resource.getResourceCode().equals(newCode) &&
                    resourceRepository.existsByResourceCode(newCode)) {
                throw new RuntimeException("Resource code already exists: " + newCode);
            }

            resource.setResourceCode(newCode);
        }

        if (resourceDTO.getName() != null) {
            resource.setName(resourceDTO.getName());
        }

        if (resourceDTO.getType() != null) {
            if (!isValidType(resourceDTO.getType())) {
                throw new RuntimeException("Invalid resource type: " + resourceDTO.getType());
            }
            resource.setType(resourceDTO.getType());
        }

        if (resourceDTO.getCapacity() != null) {
            resource.setCapacity(resourceDTO.getCapacity());
        }

        if (resourceDTO.getLocation() != null) {
            resource.setLocation(resourceDTO.getLocation());
        }

        if (resourceDTO.getDescription() != null) {
            resource.setDescription(resourceDTO.getDescription());
        }

        if (resourceDTO.getAvailabilityWindows() != null) {
            resource.setAvailabilityWindows(resourceDTO.getAvailabilityWindows());
        }

        if (resourceDTO.getStatus() != null) {
            resource.setStatus(resourceDTO.getStatus());
        }

        resource.setAvailable(resourceDTO.isAvailable());

        if (resourceDTO.getDailyRate() != null) {
            resource.setDailyRate(resourceDTO.getDailyRate());
        }

        resource.setUpdatedAt(LocalDateTime.now());

        Resource updatedResource = resourceRepository.save(resource);
        return convertToDTO(updatedResource);
    }

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

    public void deleteResource(Long id) {
        Resource resource = resourceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Resource not found with ID: " + id));

        if (resource.getImageUrl() != null && !resource.getImageUrl().isEmpty()) {
            deleteOldImage(resource.getImageUrl());
        }

        resourceRepository.delete(resource);
    }

    public ResourceStatistics getStatistics() {
        ResourceStatistics stats = new ResourceStatistics();
        stats.setTotalResources(resourceRepository.count());
        stats.setActiveResources(resourceRepository.countByStatus("ACTIVE"));
        stats.setOutOfServiceResources(resourceRepository.countByStatus("OUT_OF_SERVICE"));
        stats.setMaintenanceResources(resourceRepository.countByStatus("MAINTENANCE"));

        // If globally locked or holiday, available resources should be 0
        if (isGloballyLocked() || isHoliday()) {
            stats.setAvailableResources(0);
        } else {
            stats.setAvailableResources(resourceRepository.findByIsAvailableTrue().size());
        }

        List<Object[]> typeCounts = resourceRepository.countByType();
        Map<String, Long> typeCountMap = new HashMap<>();
        for (Object[] typeCount : typeCounts) {
            typeCountMap.put((String) typeCount[0], (Long) typeCount[1]);
        }
        stats.setTypeCounts(typeCountMap);

        return stats;
    }

    // ==================== HOLIDAY MANAGEMENT METHODS ====================

    public Holiday addHoliday(Holiday holiday) {
        if (holidayRepository.existsByHolidayDate(holiday.getHolidayDate())) {
            throw new RuntimeException("Holiday already exists for this date: " + holiday.getHolidayDate());
        }
        return holidayRepository.save(holiday);
    }

    public List<Holiday> getAllHolidays() {
        return holidayRepository.findAll();
    }

    public void deleteHoliday(Long id) {
        if (!holidayRepository.existsById(id)) {
            throw new RuntimeException("Holiday not found with ID: " + id);
        }
        holidayRepository.deleteById(id);
    }

    // ==================== EMERGENCY LOCK METHODS ====================

    public String getGlobalLockStatus() {
        return systemSettingRepository.getGlobalLockStatus();
    }

    public void setGlobalLockStatus(boolean locked) {
        systemSettingRepository.updateGlobalLockStatus(String.valueOf(locked));
    }

    // ==================== SYSTEM STATUS ====================

    public Map<String, Object> getSystemStatus() {
        Map<String, Object> status = new HashMap<>();
        status.put("globalLock", isGloballyLocked());
        status.put("isHoliday", isHoliday());
        status.put("today", LocalDate.now().toString());

        // Get upcoming holidays
        List<Holiday> upcomingHolidays = holidayRepository.findUpcomingHolidays();
        status.put("upcomingHolidays", upcomingHolidays);

        return status;
    }

    // ==================== PRIVATE HELPER METHODS ====================

    private String saveImage(MultipartFile file) throws IOException {
        Path uploadPath = Paths.get(uploadDirectory);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        String originalFilename = file.getOriginalFilename();
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }

        String filename = UUID.randomUUID().toString() + extension;
        Path filePath = uploadPath.resolve(filename);
        Files.write(filePath, file.getBytes());

        return "/api/resource-manager/images/" + filename;
    }

    private void deleteOldImage(String imageUrl) {
        try {
            String filename = imageUrl.substring(imageUrl.lastIndexOf("/") + 1);
            Path filePath = Paths.get(uploadDirectory).resolve(filename);
            Files.deleteIfExists(filePath);
        } catch (IOException e) {
            System.err.println("Failed to delete old image: " + e.getMessage());
        }
    }

    private boolean isValidType(String type) {
        return VALID_RESOURCE_TYPES.contains(type);
    }

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
        dto.setCreatedAt(resource.getCreatedAt());
        dto.setUpdatedAt(resource.getUpdatedAt());
        return dto;
    }

    // ==================== STATISTICS INNER CLASS ====================

    public static class ResourceStatistics {
        private long totalResources;
        private long activeResources;
        private long outOfServiceResources;
        private long maintenanceResources;
        private long availableResources;
        private Map<String, Long> typeCounts = new HashMap<>();

        public long getTotalResources() {
            return totalResources;
        }

        public void setTotalResources(long totalResources) {
            this.totalResources = totalResources;
        }

        public long getActiveResources() {
            return activeResources;
        }

        public void setActiveResources(long activeResources) {
            this.activeResources = activeResources;
        }

        public long getOutOfServiceResources() {
            return outOfServiceResources;
        }

        public void setOutOfServiceResources(long outOfServiceResources) {
            this.outOfServiceResources = outOfServiceResources;
        }

        public long getMaintenanceResources() {
            return maintenanceResources;
        }

        public void setMaintenanceResources(long maintenanceResources) {
            this.maintenanceResources = maintenanceResources;
        }

        public long getAvailableResources() {
            return availableResources;
        }

        public void setAvailableResources(long availableResources) {
            this.availableResources = availableResources;
        }

        public Map<String, Long> getTypeCounts() {
            return typeCounts;
        }

        public void setTypeCounts(Map<String, Long> typeCounts) {
            this.typeCounts = typeCounts;
        }
    }
}