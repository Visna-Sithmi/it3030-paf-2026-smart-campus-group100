package com.northbridge.backend.service;

import com.northbridge.backend.dto.ManagerDTO;
import com.northbridge.backend.model.User;
import com.northbridge.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ManagerService {

    @Autowired
    private UserRepository userRepository;

    // GET - Read all managers from database
    public List<ManagerDTO> getAllManagers() {
        List<User> managers = userRepository.findAllManagers();
        return managers.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    // GET - Read single manager by ID
    public ManagerDTO getManagerById(Long id) {
        User manager = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Manager not found with ID: " + id));

        // Check if user is actually a manager
        String role = manager.getRole();
        if (!role.equals("RESOURCE_MANAGER") && !role.equals("BOOKING_MANAGER") && !role.equals("ISSUE_MANAGER")) {
            throw new RuntimeException("User with ID " + id + " is not a manager");
        }

        return convertToDTO(manager);
    }

    // GET - Read managers by specific role
    public List<ManagerDTO> getManagersByRole(String role) {
        // Validate role
        if (!role.equals("RESOURCE_MANAGER") && !role.equals("BOOKING_MANAGER") && !role.equals("ISSUE_MANAGER")) {
            throw new RuntimeException("Invalid role. Must be: RESOURCE_MANAGER, BOOKING_MANAGER, or ISSUE_MANAGER");
        }

        List<User> managers = userRepository.findByRole(role);
        return managers.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    // POST - Add new manager to database
    public User addManager(ManagerDTO managerDTO) {
        // Check if email already exists
        if (userRepository.existsByEmail(managerDTO.getEmail())) {
            throw new RuntimeException("Email already exists: " + managerDTO.getEmail());
        }

        // Validate role
        String role = managerDTO.getRole();
        if (!role.equals("RESOURCE_MANAGER") && !role.equals("BOOKING_MANAGER") && !role.equals("ISSUE_MANAGER")) {
            throw new RuntimeException("Invalid role. Must be: RESOURCE_MANAGER, BOOKING_MANAGER, or ISSUE_MANAGER");
        }

        // Create new manager
        User manager = new User();
        manager.setName(managerDTO.getName());
        manager.setEmail(managerDTO.getEmail());
        manager.setPassword(managerDTO.getPassword());
        manager.setRole(managerDTO.getRole());

        return userRepository.save(manager);
    }

    // PUT - Update existing manager in database
    public ManagerDTO updateManager(Long id, ManagerDTO managerDTO) {
        // Find existing manager
        User manager = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Manager not found with ID: " + id));

        // Check if user is a manager
        String currentRole = manager.getRole();
        if (!currentRole.equals("RESOURCE_MANAGER") && !currentRole.equals("BOOKING_MANAGER") && !currentRole.equals("ISSUE_MANAGER")) {
            throw new RuntimeException("User with ID " + id + " is not a manager");
        }

        // Update name
        if (managerDTO.getName() != null && !managerDTO.getName().isEmpty()) {
            manager.setName(managerDTO.getName());
        }

        // Update email (check for duplicate if changing)
        if (managerDTO.getEmail() != null && !managerDTO.getEmail().isEmpty()) {
            if (!manager.getEmail().equals(managerDTO.getEmail()) &&
                    userRepository.existsByEmail(managerDTO.getEmail())) {
                throw new RuntimeException("Email already exists: " + managerDTO.getEmail());
            }
            manager.setEmail(managerDTO.getEmail());
        }

        // Update password
        if (managerDTO.getPassword() != null && !managerDTO.getPassword().isEmpty()) {
            manager.setPassword(managerDTO.getPassword());
        }

        // Update role
        if (managerDTO.getRole() != null && !managerDTO.getRole().isEmpty()) {
            String newRole = managerDTO.getRole();
            if (!newRole.equals("RESOURCE_MANAGER") && !newRole.equals("BOOKING_MANAGER") && !newRole.equals("ISSUE_MANAGER")) {
                throw new RuntimeException("Invalid role. Must be: RESOURCE_MANAGER, BOOKING_MANAGER, or ISSUE_MANAGER");
            }
            manager.setRole(newRole);
        }

        User updatedManager = userRepository.save(manager);
        return convertToDTO(updatedManager);
    }

    // DELETE - Remove manager from database
    public void deleteManager(Long id) {
        // Check if manager exists
        User manager = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Manager not found with ID: " + id));

        // Check if user is a manager
        String role = manager.getRole();
        if (!role.equals("RESOURCE_MANAGER") && !role.equals("BOOKING_MANAGER") && !role.equals("ISSUE_MANAGER")) {
            throw new RuntimeException("User with ID " + id + " is not a manager");
        }

        // Delete the manager
        userRepository.delete(manager);
    }

    // Convert User entity to ManagerDTO
    private ManagerDTO convertToDTO(User user) {
        return new ManagerDTO(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole()
        );
    }
}