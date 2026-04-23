package com.northbridge.backend.service;

import com.northbridge.backend.dto.ManagerDTO;
import com.northbridge.backend.model.User;
import com.northbridge.backend.repository.BookingRepository;
import com.northbridge.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;  // ADD THIS IMPORT

import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
public class ManagerService {

    private static final List<String> ADMIN_OR_MANAGER_ROLES = List.of(
        "RESOURCE_MANAGER",
        "BOOKING_MANAGER",
        "ISSUE_MANAGER",
        "LECTURER"
    );

    private static final List<String> HELPER_STAFF_ROLES = List.of(
        "TECHNICIAN",
        "CLEANER",
        "SECURITY"
    );

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BookingRepository bookingRepository;

    public List<ManagerDTO> getAllManagers() {
        List<User> managers = userRepository.findAllManagers();
        return managers.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public ManagerDTO getManagerById(Long id) {
        User manager = userRepository.findById(Objects.requireNonNull(id, "id"))
                .orElseThrow(() -> new RuntimeException("Manager not found with ID: " + id));

        String role = manager.getRole();
        if (!ADMIN_OR_MANAGER_ROLES.contains(role) && !HELPER_STAFF_ROLES.contains(role)) {
            throw new RuntimeException("User with ID " + id + " is not an allowed staff member");
        }

        return convertToDTO(manager);
    }

    public List<ManagerDTO> getManagersByRole(String role) {
        if (!ADMIN_OR_MANAGER_ROLES.contains(role) && !HELPER_STAFF_ROLES.contains(role)) {
            throw new RuntimeException("Invalid role. Must be: RESOURCE_MANAGER, BOOKING_MANAGER, ISSUE_MANAGER, LECTURER, TECHNICIAN, CLEANER, or SECURITY");
        }

        List<User> managers = userRepository.findByRole(role);
        return managers.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public User addManager(ManagerDTO managerDTO) {
        if (userRepository.existsByEmail(managerDTO.getEmail())) {
            throw new RuntimeException("Email already exists: " + managerDTO.getEmail());
        }

        String role = managerDTO.getRole();
        if (!ADMIN_OR_MANAGER_ROLES.contains(role) && !HELPER_STAFF_ROLES.contains(role)) {
            throw new RuntimeException("Invalid role. Must be: RESOURCE_MANAGER, BOOKING_MANAGER, ISSUE_MANAGER, LECTURER, TECHNICIAN, CLEANER, or SECURITY");
        }

        User manager = new User();
        manager.setName(managerDTO.getName());
        manager.setEmail(managerDTO.getEmail());
        manager.setPassword(managerDTO.getPassword());
        manager.setRole(managerDTO.getRole());

        if (managerDTO.getIsActive() != null) {
            manager.setActive(managerDTO.getIsActive());
        } else {
            manager.setActive(true);
        }

        return userRepository.save(manager);
    }

    @Transactional  // ADD THIS ANNOTATION
    public ManagerDTO updateManager(Long id, ManagerDTO managerDTO) {
        User manager = userRepository.findById(Objects.requireNonNull(id, "id"))
                .orElseThrow(() -> new RuntimeException("Manager not found with ID: " + id));

        String currentRole = manager.getRole();
        if (!ADMIN_OR_MANAGER_ROLES.contains(currentRole) && !HELPER_STAFF_ROLES.contains(currentRole)) {
            throw new RuntimeException("User with ID " + id + " is not an allowed staff member");
        }

        if (managerDTO.getName() != null && !managerDTO.getName().isEmpty()) {
            manager.setName(managerDTO.getName());
        }

        if (managerDTO.getEmail() != null && !managerDTO.getEmail().isEmpty()) {
            if (!manager.getEmail().equals(managerDTO.getEmail()) &&
                    userRepository.existsByEmail(managerDTO.getEmail())) {
                throw new RuntimeException("Email already exists: " + managerDTO.getEmail());
            }
            manager.setEmail(managerDTO.getEmail());
        }

        if (managerDTO.getPassword() != null && !managerDTO.getPassword().isEmpty()) {
            manager.setPassword(managerDTO.getPassword());
        }

        if (managerDTO.getRole() != null && !managerDTO.getRole().isEmpty()) {
            String newRole = managerDTO.getRole();
            if (!ADMIN_OR_MANAGER_ROLES.contains(newRole) && !HELPER_STAFF_ROLES.contains(newRole)) {
                throw new RuntimeException("Invalid role. Must be: RESOURCE_MANAGER, BOOKING_MANAGER, ISSUE_MANAGER, LECTURER, TECHNICIAN, CLEANER, or SECURITY");
            }
            manager.setRole(newRole);
        }

        // FIX THIS PART - Always update isActive if provided
        if (managerDTO.getIsActive() != null) {
            manager.setActive(managerDTO.getIsActive());  // This will set to false when deactivated
        }

        User updatedManager = userRepository.save(manager);
        return convertToDTO(updatedManager);
    }

    @Transactional
    public void deleteManager(Long id) {
        User manager = userRepository.findById(Objects.requireNonNull(id, "id"))
                .orElseThrow(() -> new RuntimeException("Manager not found with ID: " + id));

        String role = manager.getRole();
        if (!ADMIN_OR_MANAGER_ROLES.contains(role) && !HELPER_STAFF_ROLES.contains(role)) {
            throw new RuntimeException("User with ID " + id + " is not an allowed staff member");
        }

        if (bookingRepository.existsByRequestedById(id)) {
            throw new RuntimeException("Cannot delete manager because they are linked as booking requester in existing bookings. Deactivate the account instead.");
        }

        bookingRepository.clearApproverReferences(id);

        userRepository.delete(manager);
    }

    private ManagerDTO convertToDTO(User user) {
        return new ManagerDTO(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole(),
                user.isActive()
        );
    }
}