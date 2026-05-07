package com.example.erp.Dto;

import com.example.erp.models.PtoStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class PtoRequestDto {
    private Long id;
    private Long employeeId;
    private String employeeName;
    private LocalDate startDate;
    private LocalDate endDate;
    private String reason;
    private PtoStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime reviewedAt;
    private String reviewNote;
    private BigDecimal hoursRequested;
    private BigDecimal ptoBalanceHours;

    public PtoRequestDto(
            Long id,
            Long employeeId,
            String employeeName,
            LocalDate startDate,
            LocalDate endDate,
            String reason,
            PtoStatus status,
            LocalDateTime createdAt,
            LocalDateTime reviewedAt,
            String reviewNote,
            BigDecimal hoursRequested,
            BigDecimal ptoBalanceHours
    ) {
        this.id = id;
        this.employeeId = employeeId;
        this.employeeName = employeeName;
        this.startDate = startDate;
        this.endDate = endDate;
        this.reason = reason;
        this.status = status;
        this.createdAt = createdAt;
        this.reviewedAt = reviewedAt;
        this.reviewNote = reviewNote;
        this.hoursRequested = hoursRequested;
        this.ptoBalanceHours = ptoBalanceHours;
    }

    public Long getId() {
        return id;
    }

    public Long getEmployeeId() {
        return employeeId;
    }

    public String getEmployeeName() {
        return employeeName;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public String getReason() {
        return reason;
    }

    public PtoStatus getStatus() {
        return status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getReviewedAt() {
        return reviewedAt;
    }

    public String getReviewNote() {
        return reviewNote;
    }

    public BigDecimal getHoursRequested() {
        return hoursRequested;
    }

    public BigDecimal getPtoBalanceHours() {
        return ptoBalanceHours;
    }
}