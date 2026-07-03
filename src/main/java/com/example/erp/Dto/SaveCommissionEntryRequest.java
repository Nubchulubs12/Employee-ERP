package com.example.erp.Dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public class SaveCommissionEntryRequest {

    @NotNull(message = "Employee is required.")
    private Long employeeId;

    @NotBlank(message = "Description is required.")
    @Size(max = 255, message = "Description must be 255 characters or fewer.")
    private String description;

    @NotNull(message = "Commission amount is required.")
    @DecimalMin(value = "0.01", message = "Commission amount must be greater than zero.")
    private BigDecimal amount;

    @NotNull(message = "Date earned is required.")
    private LocalDate dateEarned;

    @Size(max = 2000, message = "Notes must be 2000 characters or fewer.")
    private String notes;

    public Long getEmployeeId() { return employeeId; }
    public void setEmployeeId(Long employeeId) { this.employeeId = employeeId; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public LocalDate getDateEarned() { return dateEarned; }
    public void setDateEarned(LocalDate dateEarned) { this.dateEarned = dateEarned; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
