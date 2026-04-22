package com.northbridge.backend.dto;

public class ManagerProfileResponseDTO {

    private Long id;
    private String name;
    private String email;
    private String role;
    private String profileImageUrl;

    public ManagerProfileResponseDTO() {
    }

    public ManagerProfileResponseDTO(Long id, String name, String email, String role, String profileImageUrl) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.role = role;
        this.profileImageUrl = profileImageUrl;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getProfileImageUrl() {
        return profileImageUrl;
    }

    public void setProfileImageUrl(String profileImageUrl) {
        this.profileImageUrl = profileImageUrl;
    }
}
