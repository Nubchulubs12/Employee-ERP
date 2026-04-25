package com.example.erp.Dto;

import java.time.LocalDateTime;

public class UpdateTimeEntryRequest {
    private LocalDateTime clockInTime;
    private LocalDateTime clockOutTime;

    public LocalDateTime getClockInTime() {
        return clockInTime;
    }

    public void setClockInTime(LocalDateTime clockInTime) {
        this.clockInTime = clockInTime;
    }

    public LocalDateTime getClockOutTime() {
        return clockOutTime;
    }

    public void setClockOutTime(LocalDateTime clockOutTime) {
        this.clockOutTime = clockOutTime;
    }
}

