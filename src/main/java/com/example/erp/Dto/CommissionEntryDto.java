package com.example.erp.Dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record CommissionEntryDto(
        Long id,
        Long employeeId,
        String employeeName,
        Long companyId,
        String description,
        BigDecimal amount,
        LocalDate dateEarned,
        String notes
) {}
