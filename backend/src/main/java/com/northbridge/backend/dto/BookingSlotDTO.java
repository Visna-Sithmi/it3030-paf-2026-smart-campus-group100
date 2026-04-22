package com.northbridge.backend.dto;

import com.northbridge.backend.model.BookingStatus;

import java.time.LocalTime;

public class BookingSlotDTO {

    private LocalTime startTime;
    private LocalTime endTime;
    private BookingStatus status;

    public BookingSlotDTO() {
    }

    public BookingSlotDTO(LocalTime startTime, LocalTime endTime, BookingStatus status) {
        this.startTime = startTime;
        this.endTime = endTime;
        this.status = status;
    }

    public LocalTime getStartTime() {
        return startTime;
    }

    public void setStartTime(LocalTime startTime) {
        this.startTime = startTime;
    }

    public LocalTime getEndTime() {
        return endTime;
    }

    public void setEndTime(LocalTime endTime) {
        this.endTime = endTime;
    }

    public BookingStatus getStatus() {
        return status;
    }

    public void setStatus(BookingStatus status) {
        this.status = status;
    }
}
