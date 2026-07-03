package com.example.erp.Dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public class SaveCompanyMonthlyJobRequest {

    @NotBlank(message = "Job name is required.")
    private String jobName;

    @NotNull
    @DecimalMin(value = "0.00", message = "Job amount cannot be negative.")
    private BigDecimal amount;

    public String getJobName() { return jobName; }
    public void setJobName(String jobName) { this.jobName = jobName; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
}
