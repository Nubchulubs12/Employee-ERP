package com.example.erp.Dto;

import java.time.LocalDate;

public class CompanyDto {
    private Long id;
    private String name;
    private String email;
    private String phone;
    private String address;
    private String streetAddress;
    private String addressLine2;
    private String city;
    private String state;
    private String zip;
    private String country;
    private String payrollType;
    private String payday;
    private LocalDate biweeklyStartDate;
    private String planCode;
    private String planName;
    private Integer employeeLimit;
    private LocalDate planStartedOn;
    private LocalDate trialEndsOn;
    private Boolean trialExpired;
    private String billingStatus;
    private String stripeSubscriptionStatus;
    private LocalDate stripeCurrentPeriodEnd;

    public CompanyDto() {}

    public CompanyDto(
            Long id,
            String name,
            String email,
            String phone,
            String address,
            String streetAddress,
            String addressLine2,
            String city,
            String state,
            String zip,
            String country,
            String payrollType,
            String payday,
            LocalDate biweeklyStartDate,
            String planCode,
            String planName,
            Integer employeeLimit,
            LocalDate planStartedOn,
            LocalDate trialEndsOn,
            Boolean trialExpired,
            String billingStatus,
            String stripeSubscriptionStatus,
            LocalDate stripeCurrentPeriodEnd
    ) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.phone = phone;
        this.address = address;
        this.streetAddress = streetAddress;
        this.addressLine2 = addressLine2;
        this.city = city;
        this.state = state;
        this.zip = zip;
        this.country = country;
        this.payrollType = payrollType;
        this.payday = payday;
        this.biweeklyStartDate = biweeklyStartDate;
        this.planCode = planCode;
        this.planName = planName;
        this.employeeLimit = employeeLimit;
        this.planStartedOn = planStartedOn;
        this.trialEndsOn = trialEndsOn;
        this.trialExpired = trialExpired;
        this.billingStatus = billingStatus;
        this.stripeSubscriptionStatus = stripeSubscriptionStatus;
        this.stripeCurrentPeriodEnd = stripeCurrentPeriodEnd;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getStreetAddress() { return streetAddress; }
    public void setStreetAddress(String streetAddress) { this.streetAddress = streetAddress; }

    public String getAddressLine2() { return addressLine2; }
    public void setAddressLine2(String addressLine2) { this.addressLine2 = addressLine2; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public String getState() { return state; }
    public void setState(String state) { this.state = state; }

    public String getZip() { return zip; }
    public void setZip(String zip) { this.zip = zip; }

    public String getCountry() { return country; }
    public void setCountry(String country) { this.country = country; }

    public String getPayrollType() { return payrollType; }
    public void setPayrollType(String payrollType) { this.payrollType = payrollType; }

    public String getPayday() { return payday; }
    public void setPayday(String payday) { this.payday = payday; }

    public LocalDate getBiweeklyStartDate() { return biweeklyStartDate; }
    public void setBiweeklyStartDate(LocalDate biweeklyStartDate) { this.biweeklyStartDate = biweeklyStartDate; }

    public String getPlanCode() { return planCode; }
    public void setPlanCode(String planCode) { this.planCode = planCode; }

    public String getPlanName() { return planName; }
    public void setPlanName(String planName) { this.planName = planName; }

    public Integer getEmployeeLimit() { return employeeLimit; }
    public void setEmployeeLimit(Integer employeeLimit) { this.employeeLimit = employeeLimit; }

    public LocalDate getPlanStartedOn() { return planStartedOn; }
    public void setPlanStartedOn(LocalDate planStartedOn) { this.planStartedOn = planStartedOn; }

    public LocalDate getTrialEndsOn() { return trialEndsOn; }
    public void setTrialEndsOn(LocalDate trialEndsOn) { this.trialEndsOn = trialEndsOn; }

    public Boolean getTrialExpired() { return trialExpired; }
    public void setTrialExpired(Boolean trialExpired) { this.trialExpired = trialExpired; }

    public String getBillingStatus() { return billingStatus; }
    public void setBillingStatus(String billingStatus) { this.billingStatus = billingStatus; }

    public String getStripeSubscriptionStatus() { return stripeSubscriptionStatus; }
    public void setStripeSubscriptionStatus(String stripeSubscriptionStatus) { this.stripeSubscriptionStatus = stripeSubscriptionStatus; }

    public LocalDate getStripeCurrentPeriodEnd() { return stripeCurrentPeriodEnd; }
    public void setStripeCurrentPeriodEnd(LocalDate stripeCurrentPeriodEnd) { this.stripeCurrentPeriodEnd = stripeCurrentPeriodEnd; }
}
