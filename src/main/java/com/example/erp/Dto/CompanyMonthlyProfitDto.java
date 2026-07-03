package com.example.erp.Dto;

import java.math.BigDecimal;

public record CompanyMonthlyProfitDto(
        Long id,
        Long companyId,
        Integer year,
        Integer month,
        BigDecimal grossProfit
) {
}
