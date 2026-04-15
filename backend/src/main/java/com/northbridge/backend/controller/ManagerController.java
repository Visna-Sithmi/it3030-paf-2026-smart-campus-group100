package com.northbridge.backend.controller;

import com.northbridge.backend.dto.ApiResponse;
import com.northbridge.backend.dto.ManagerDTO;
import com.northbridge.backend.model.User;
import com.northbridge.backend.service.ManagerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/admin/managers")
@CrossOrigin(origins = "http://localhost:5173")
public class ManagerController {

    @Autowired
    private ManagerService managerService;

    // GET ALL MANAGERS - Read all managers from database
    @GetMapping("/all")
    public ResponseEntity<ApiResponse> getAllManagers() {
        try {
            List<ManagerDTO> managers = managerService.getAllManagers();
            ApiResponse response = new ApiResponse(true, "Managers retrieved successfully", managers);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            ApiResponse response = new ApiResponse(false, "Error fetching managers: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    // GET MANAGER BY ID - Read single manager
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse> getManagerById(@PathVariable Long id) {
        try {
            ManagerDTO manager = managerService.getManagerById(id);
            ApiResponse response = new ApiResponse(true, "Manager retrieved successfully", manager);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            ApiResponse response = new ApiResponse(false, e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }
    }

    // GET MANAGERS BY ROLE - Read managers by role
    @GetMapping("/role/{role}")
    public ResponseEntity<ApiResponse> getManagersByRole(@PathVariable String role) {
        try {
            List<ManagerDTO> managers = managerService.getManagersByRole(role);
            ApiResponse response = new ApiResponse(true, "Managers retrieved successfully", managers);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            ApiResponse response = new ApiResponse(false, e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    // ADD MANAGER - Create new manager in database
    @PostMapping("/add")
    public ResponseEntity<ApiResponse> addManager(@RequestBody ManagerDTO managerDTO) {
        try {
            User newManager = managerService.addManager(managerDTO);
            ApiResponse response = new ApiResponse(true, "Manager added successfully", newManager);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (RuntimeException e) {
            ApiResponse response = new ApiResponse(false, e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    // UPDATE MANAGER - Edit existing manager in database
    @PutMapping("/update/{id}")
    public ResponseEntity<ApiResponse> updateManager(@PathVariable Long id, @RequestBody ManagerDTO managerDTO) {
        try {
            ManagerDTO updatedManager = managerService.updateManager(id, managerDTO);
            ApiResponse response = new ApiResponse(true, "Manager updated successfully", updatedManager);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            ApiResponse response = new ApiResponse(false, e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    // DELETE MANAGER - Remove manager from database
    @DeleteMapping("/delete/{id}")
    public ResponseEntity<ApiResponse> deleteManager(@PathVariable Long id) {
        try {
            managerService.deleteManager(id);
            ApiResponse response = new ApiResponse(true, "Manager deleted successfully");
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            ApiResponse response = new ApiResponse(false, e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }
    }
}