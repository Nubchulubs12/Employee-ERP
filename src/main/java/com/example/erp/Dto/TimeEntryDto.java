package com.example.erp.Dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class TimeEntryDto {
    private Long id;
    private LocalDate workDate;
    private LocalDateTime clockInTime;
    private LocalDateTime clockOutTime;

    public TimeEntryDto(Long id, LocalDate workDate, LocalDateTime clockInTime, LocalDateTime clockOutTime) {
        this.id = id;
        this.workDate = workDate;
        this.clockInTime = clockInTime;
        this.clockOutTime = clockOutTime;
    }

    public Long getId() {
        return id;
    }

    public LocalDate getWorkDate() {
        return workDate;
    }

    public LocalDateTime getClockInTime() {
        return clockInTime;
    }

    public LocalDateTime getClockOutTime() {
        return clockOutTime;
    }
}