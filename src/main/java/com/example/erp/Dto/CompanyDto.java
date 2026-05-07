package com.example.erp.Dto;

import java.time.LocalDate;

public class CompanyDto {
    private Long id;
    private String name;
    private String email;
    private String phone;
    private String address;
    private String payrollType;
    private String payday;
    private LocalDate biweeklyStartDate;

    public CompanyDto() {
    }

    public CompanyDto(Long id, String name, String email, String phone, String address, String payrollType, String payday, LocalDate biweeklyStartDate) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.phone = phone;
        this.address = address;
        this.payrollType = payrollType;
        this.payday = payday;
        this.biweeklyStartDate = biweeklyStartDate;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

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

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }
}