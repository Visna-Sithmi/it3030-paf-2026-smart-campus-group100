package com.northbridge.backend.dto;

public class TopTechnicianDTO {
    private String name;
    private Long count;

    public TopTechnicianDTO() {
    }

    public TopTechnicianDTO(String name, Long count) {
        this.name = name;
        this.count = count;
    }

    public String getName() {
        return name;
    }

    public Long getCount() {
        return count;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void setCount(Long count) {
        this.count = count;
    }
}

