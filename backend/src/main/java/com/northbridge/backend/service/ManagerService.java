package com.northbridge.backend.service;

import com.northbridge.backend.dto.ManagerDTO;
import com.northbridge.backend.model.User;
import com.northbridge.backend.repository.BookingRepository;
import com.northbridge.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;  // ADD THIS IMPORT

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ManagerService {

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
        User manager = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Manager not found with ID: " + id));

        String role = manager.getRole();
        if (!role.equals("RESOURCE_MANAGER") &&
                !role.equals("BOOKING_MANAGER") &&
                !role.equals("ISSUE_MANAGER")) {
            throw new RuntimeException("User with ID " + id + " is not a manager");
        }

        return convertToDTO(manager);
    }

    public List<ManagerDTO> getManagersByRole(String role) {
        if (!role.equals("RESOURCE_MANAGER") &&
                !role.equals("BOOKING_MANAGER") &&
                !role.equals("ISSUE_MANAGER")) {
            throw new RuntimeException("Invalid role. Must be: RESOURCE_MANAGER, BOOKING_MANAGER, or ISSUE_MANAGER");
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
        if (!role.equals("RESOURCE_MANAGER") &&
                !role.equals("BOOKING_MANAGER") &&
                !role.equals("ISSUE_MANAGER")) {
            throw new RuntimeException("Invalid role. Must be: RESOURCE_MANAGER, BOOKING_MANAGER, or ISSUE_MANAGER");
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
        User manager = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Manager not found with ID: " + id));

        String currentRole = manager.getRole();
        if (!currentRole.equals("RESOURCE_MANAGER") &&
                !currentRole.equals("BOOKING_MANAGER") &&
                !currentRole.equals("ISSUE_MANAGER")) {
            throw new RuntimeException("User with ID " + id + " is not a manager");
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
            if (!newRole.equals("RESOURCE_MANAGER") &&
                    !newRole.equals("BOOKING_MANAGER") &&
                    !newRole.equals("ISSUE_MANAGER")) {
                throw new RuntimeException("Invalid role. Must be: RESOURCE_MANAGER, BOOKING_MANAGER, or ISSUE_MANAGER");
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
        User manager = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Manager not found with ID: " + id));

        String role = manager.getRole();
        if (!role.equals("RESOURCE_MANAGER") &&
                !role.equals("BOOKING_MANAGER") &&
                !role.equals("ISSUE_MANAGER")) {
            throw new RuntimeException("User with ID " + id + " is not a manager");
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