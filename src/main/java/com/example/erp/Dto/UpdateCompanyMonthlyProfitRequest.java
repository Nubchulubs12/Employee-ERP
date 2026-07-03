package com.example.erp.Dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public class UpdateCompanyMonthlyProfitRequest {

    @NotNull
    @DecimalMin(value = "0.00", message = "Gross profit cannot be negative.")
    private BigDecimal grossProfit;

    public BigDecimal getGrossProfit() {
        return grossProfit;
    }

    public void setGrossProfit(BigDecimal grossProfit) {
        this.grossProfit = grossProfit;
    }
}
