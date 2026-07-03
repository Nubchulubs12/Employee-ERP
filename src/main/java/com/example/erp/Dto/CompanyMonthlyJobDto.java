package com.example.erp.Dto;

import java.math.BigDecimal;

public record CompanyMonthlyJobDto(
        Long id,
        Long companyId,
        Integer year,
        Integer month,
        String jobName,
        BigDecimal amount
) {
}
