package com.example.erp.Dto;

import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public class CreatePtoRequest {

    @NotNull
    private LocalDate startDate;

    @NotNull
    private LocalDate endDate;
    @NotNull
    private BigDecimal hoursRequested;

    private String reason;

    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }

    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public BigDecimal getHoursRequested() {
        return hoursRequested;
    }

    public void setHoursRequested(BigDecimal hoursRequested) {
        this.hoursRequested = hoursRequested;
    }
}