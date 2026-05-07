package com.example.erp.Dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public class EmployeeDto {
    private Long id;
    private String firstName;
    private String lastName;
    private String email;
    private String jobTitle;
    private LocalDate hireDate;
    private Long companyId;
    private String companyName;
    private BigDecimal hourlyRate;
    private BigDecimal ptoBalanceHours;

    public EmployeeDto(
            Long id,
            String firstName,
            String lastName,
            String email,
            String jobTitle,
            LocalDate hireDate,
            Long companyId,
            String companyName,
            BigDecimal hourlyRate,
            BigDecimal ptoBalanceHours
    ) {
        this.id = id;
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.jobTitle = jobTitle;
        this.hireDate = hireDate;
        this.companyId = companyId;
        this.companyName = companyName;
        this.hourlyRate = hourlyRate;
        this.ptoBalanceHours = ptoBalanceHours;
    }

    public Long getId() { return id; }
    public String getFirstName() { return firstName; }
    public String getLastName() { return lastName; }
    public String getEmail() { return email; }
    public String getJobTitle() { return jobTitle; }
    public LocalDate getHireDate() { return hireDate; }
    public Long getCompanyId() { return companyId; }
    public String getCompanyName() { return companyName; }
    public BigDecimal getHourlyRate() { return hourlyRate; }
    public BigDecimal getPtoBalanceHours() { return ptoBalanceHours; }
}