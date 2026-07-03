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
    private String payType;
    private BigDecimal salaryRate;
    private BigDecimal commissionPercentage;
    private String phone;
    private String streetAddress;
    private String addressLine2;
    private String city;
    private String state;
    private String zip;
    private String country;
    private String emergencyContact;
    private String emergencyPhone;

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
            BigDecimal salaryRate,
            String payType,
            BigDecimal commissionPercentage,
            BigDecimal ptoBalanceHours,
            String phone,
            String streetAddress,
            String addressLine2,
            String city,
            String state,
            String zip,
            String country,
            String emergencyContact,
            String emergencyPhone
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
        this.salaryRate = salaryRate;
        this.payType = payType;
        this.commissionPercentage = commissionPercentage;
        this.ptoBalanceHours = ptoBalanceHours;
        this.phone = phone;
        this.streetAddress = streetAddress;
        this.addressLine2 = addressLine2;
        this.city = city;
        this.state = state;
        this.zip = zip;
        this.country = country;
        this.emergencyContact = emergencyContact;
        this.emergencyPhone = emergencyPhone;
    }

    public String getPhone() {
        return phone;
    }

    public String getStreetAddress() {
        return streetAddress;
    }

    public String getAddressLine2() {
        return addressLine2;
    }

    public String getCity() {
        return city;
    }

    public String getState() {
        return state;
    }

    public String getZip() {
        return zip;
    }

    public String getCountry() {
        return country;
    }

    public String getEmergencyContact() {
        return emergencyContact;
    }

    public String getEmergencyPhone() {
        return emergencyPhone;
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

    public String getPayType() {
        return payType;
    }

    public BigDecimal getSalaryRate() {
        return salaryRate;
    }

    public BigDecimal getCommissionPercentage() {
        return commissionPercentage;
    }
}
