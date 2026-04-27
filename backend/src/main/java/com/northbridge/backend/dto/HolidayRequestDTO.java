package com.northbridge.backend.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.LocalDate;

public class HolidayRequestDTO {
    
    @JsonProperty("holidayName")
    private String holidayName;
    
    @JsonProperty("holidayDate")
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    private LocalDate holidayDate;
    
    @JsonProperty("description")
    private String description;

    // Getters and Setters
    public String getHolidayName() { 
        return holidayName; 
    }
    
    public void setHolidayName(String holidayName) { 
        this.holidayName = holidayName; 
    }

    public LocalDate getHolidayDate() { 
        return holidayDate; 
    }
    
    public void setHolidayDate(LocalDate holidayDate) { 
        this.holidayDate = holidayDate; 
    }

    public String getDescription() { 
        return description; 
    }
    
    public void setDescription(String description) { 
        this.description = description; 
    }
}