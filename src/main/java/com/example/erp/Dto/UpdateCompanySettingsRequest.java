package com.example.erp.Dto;

import java.time.LocalDate;

public class UpdateCompanySettingsRequest {
    private String payrollType;
    private String payday;
    private LocalDate biweeklyStartDate;

    public String getPayrollType() {
        return payrollType;
    }

    public void setPayrollType(String payrollType) {
        this.payrollType = payrollType;
    }

    public String getPayday() {
        return payday;
    }

    public void setPayday(String payday) {
        this.payday = payday;
    }

    public LocalDate getBiweeklyStartDate() {
        return biweeklyStartDate;
    }

    public void setBiweeklyStartDate(LocalDate biweeklyStartDate) {
        this.biweeklyStartDate = biweeklyStartDate;
    }
}