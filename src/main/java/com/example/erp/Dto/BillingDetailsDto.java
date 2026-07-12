package com.example.erp.Dto;

import java.time.LocalDate;

public class BillingDetailsDto {
    private String planName;
    private String billingStatus;
    private String subscriptionStatus;
    private LocalDate nextBillingDate;

    public BillingDetailsDto() {
    }

    public BillingDetailsDto(String planName, String billingStatus, String subscriptionStatus, LocalDate nextBillingDate) {
        this.planName = planName;
        this.billingStatus = billingStatus;
        this.subscriptionStatus = subscriptionStatus;
        this.nextBillingDate = nextBillingDate;
    }

    public String getPlanName() {
        return planName;
    }

    public void setPlanName(String planName) {
        this.planName = planName;
    }

    public String getBillingStatus() {
        return billingStatus;
    }

    public void setBillingStatus(String billingStatus) {
        this.billingStatus = billingStatus;
    }

    public String getSubscriptionStatus() {
        return subscriptionStatus;
    }

    public void setSubscriptionStatus(String subscriptionStatus) {
        this.subscriptionStatus = subscriptionStatus;
    }

    public LocalDate getNextBillingDate() {
        return nextBillingDate;
    }

    public void setNextBillingDate(LocalDate nextBillingDate) {
        this.nextBillingDate = nextBillingDate;
    }
}
