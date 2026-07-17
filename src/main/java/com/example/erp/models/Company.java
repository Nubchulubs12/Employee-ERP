package com.example.erp.models;

import jakarta.persistence.*;

import java.time.LocalDate;
import java.time.Instant;

@Entity
@Table(name = "companies")
public class Company {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    private String phone;
    private String address;

    @Column(nullable = false)
    private String pwHash;
    private String payrollType;
    private String payday;
    private LocalDate biweeklyStartDate;
    @Column(name = "streetAddress")
    private String streetAddress;

    @Column(name = "addressLine2")
    private String addressLine2;

    @Column(name = "city")
    private String city;

    @Column(name = "state")
    private String state;

    @Column(name = "zip")
    private String zip;

    @Column(name = "country")
    private String country;

    @Column
    private String planCode = CompanyPlan.TRIAL.getCode();

    @Column
    private LocalDate planStartedOn;

    @Column
    private String billingStatus;

    @Column
    private String stripeCustomerId;

    @Column
    private String stripeSubscriptionId;

    @Column
    private String stripePriceId;

    @Column
    private String stripeSubscriptionStatus;

    @Column
    private LocalDate stripeCurrentPeriodEnd;

    @Column
    private LocalDate freeTrialFiveDayEmailSentOn;

    @Column
    private LocalDate freeTrialExpirationEmailSentOn;
    private Instant termsAcceptedAt;
    private Instant privacyAcceptedAt;
    private String acceptedTermsVersion;
    private String acceptedPrivacyVersion;
    private Instant subscriptionCanceledAt;

    public Company() {
    }

    public Instant getTermsAcceptedAt() { return termsAcceptedAt; }
    public void setTermsAcceptedAt(Instant termsAcceptedAt) { this.termsAcceptedAt = termsAcceptedAt; }
    public Instant getPrivacyAcceptedAt() { return privacyAcceptedAt; }
    public void setPrivacyAcceptedAt(Instant privacyAcceptedAt) { this.privacyAcceptedAt = privacyAcceptedAt; }
    public String getAcceptedTermsVersion() { return acceptedTermsVersion; }
    public void setAcceptedTermsVersion(String acceptedTermsVersion) { this.acceptedTermsVersion = acceptedTermsVersion; }
    public String getAcceptedPrivacyVersion() { return acceptedPrivacyVersion; }
    public void setAcceptedPrivacyVersion(String acceptedPrivacyVersion) { this.acceptedPrivacyVersion = acceptedPrivacyVersion; }
    public Instant getSubscriptionCanceledAt() { return subscriptionCanceledAt; }
    public void setSubscriptionCanceledAt(Instant subscriptionCanceledAt) { this.subscriptionCanceledAt = subscriptionCanceledAt; }

    public String getPayrollType() {
        return payrollType;
    }
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

    public String getPlanCode() { return planCode; }
    public void setPlanCode(String planCode) { this.planCode = planCode; }

    public LocalDate getPlanStartedOn() { return planStartedOn; }
    public void setPlanStartedOn(LocalDate planStartedOn) { this.planStartedOn = planStartedOn; }

    public String getBillingStatus() { return billingStatus; }
    public void setBillingStatus(String billingStatus) { this.billingStatus = billingStatus; }

    public String getStripeCustomerId() { return stripeCustomerId; }
    public void setStripeCustomerId(String stripeCustomerId) { this.stripeCustomerId = stripeCustomerId; }

    public String getStripeSubscriptionId() { return stripeSubscriptionId; }
    public void setStripeSubscriptionId(String stripeSubscriptionId) { this.stripeSubscriptionId = stripeSubscriptionId; }

    public String getStripePriceId() { return stripePriceId; }
    public void setStripePriceId(String stripePriceId) { this.stripePriceId = stripePriceId; }

    public String getStripeSubscriptionStatus() { return stripeSubscriptionStatus; }
    public void setStripeSubscriptionStatus(String stripeSubscriptionStatus) { this.stripeSubscriptionStatus = stripeSubscriptionStatus; }

    public LocalDate getStripeCurrentPeriodEnd() { return stripeCurrentPeriodEnd; }
    public void setStripeCurrentPeriodEnd(LocalDate stripeCurrentPeriodEnd) { this.stripeCurrentPeriodEnd = stripeCurrentPeriodEnd; }

    public LocalDate getFreeTrialFiveDayEmailSentOn() { return freeTrialFiveDayEmailSentOn; }
    public void setFreeTrialFiveDayEmailSentOn(LocalDate freeTrialFiveDayEmailSentOn) { this.freeTrialFiveDayEmailSentOn = freeTrialFiveDayEmailSentOn; }

    public LocalDate getFreeTrialExpirationEmailSentOn() { return freeTrialExpirationEmailSentOn; }
    public void setFreeTrialExpirationEmailSentOn(LocalDate freeTrialExpirationEmailSentOn) { this.freeTrialExpirationEmailSentOn = freeTrialExpirationEmailSentOn; }

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

    public String getPwHash() {
        return pwHash;
    }

    public void setPwHash(String pwHash) {
        this.pwHash = pwHash;
    }
}
