package com.example.erp.services;

import com.example.erp.Dto.*;
import com.example.erp.data.EmployeeRepository;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import com.example.erp.models.Company;
import com.example.erp.models.CompanyPlan;
import com.example.erp.data.CompanyRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class CompanyService {
    public static final String MAX_EMPLOYEES_MESSAGE = "you have reached the max number off employees this plan is allowed, upgrade to add more employees.";
    public static final String GROWING_MAX_EMPLOYEES_MESSAGE = "You have reached the maximum limit of this plan";
    public static final String TRIAL_EXPIRED_MESSAGE = "Your trial has expired. Upgrade to continue using the company portal.";
    public static final String BILLING_INACTIVE_MESSAGE = "Your subscription is not active. Update billing to continue using the company portal.";
    public static final String PAID_PLAN_REQUIRES_STRIPE_MESSAGE = "Paid plan changes must be completed through Stripe billing.";
    private static final int TRIAL_DAYS = 30;

    private final CompanyRepository companyRepository;
    private final EmployeeRepository employeeRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    public CompanyService(CompanyRepository companyRepository,
                          EmployeeRepository employeeRepository,
                          BCryptPasswordEncoder passwordEncoder) {
        this.companyRepository = companyRepository;
        this.employeeRepository = employeeRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public List<CompanyDto> getAllCompanies() {
        return companyRepository.findAll()
                .stream()
                .map(this::toDto)
                .toList();
    }

    public CompanyDto createCompany(CreateCompanyRequest request) {

        if (companyRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email is already in use by a company account.");
        }
        if (employeeRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email is already in use by an employee account.");
        }

        Company company = new Company();
        company.setName(request.getName());
        company.setEmail(request.getEmail());
        company.setPhone(request.getPhone());
        company.setAddress(request.getAddress());
        company.setPwHash(passwordEncoder.encode(request.getPassword()));
        company.setPlanCode(CompanyPlan.TRIAL.getCode());
        company.setPlanStartedOn(LocalDate.now());
        company.setStreetAddress(request.getStreetAddress());
        company.setAddressLine2(request.getAddressLine2());
        company.setCity(request.getCity());
        company.setState(request.getState());
        company.setZip(request.getZip());
        company.setCountry(request.getCountry());

        return toDto(companyRepository.save(company));
    }

    public CompanyDto getCompanyById(Long id) {
        Company company = companyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Company not found with id: " + id));
        ensurePlanStartedOn(company);
        return toDto(company);
    }

    public Company getCompanyEntityById(Long id) {
        Company company = companyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Company not found with id: " + id));
        ensurePlanStartedOn(company);
        return company;
    }

    public CompanyDto updateCompanySettings(Long id, UpdateCompanySettingsRequest request) {
        Company company = companyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Company not found with id: " + id));
        assertCompanyCanWrite(company);

        company.setPayrollType(request.getPayrollType());
        company.setPayday(request.getPayday());
        company.setBiweeklyStartDate(request.getBiweeklyStartDate());

        return toDto(companyRepository.save(company));
    }

    public CompanyDto updateCompanyPlan(Long id, UpdateCompanyPlanRequest request) {
        Company company = companyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Company not found with id: " + id));
        CompanyPlan plan = CompanyPlan.fromCode(request.getPlanCode());

        if (!plan.isTrial()) {
            throw new RuntimeException(PAID_PLAN_REQUIRES_STRIPE_MESSAGE);
        }

        long currentEmployeeCount = employeeRepository.countByCompanyId(company.getId());

        if (currentEmployeeCount > plan.getEmployeeLimit()) {
            throw new RuntimeException(getMaxEmployeesMessage(plan));
        }

        company.setPlanCode(plan.getCode());
        company.setPlanStartedOn(LocalDate.now());
        return toDto(companyRepository.save(company));
    }

    public CompanyDto updateCompanyInfo(Long id, UpdateCompanyInfoRequest request) {
        Company company = companyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Company not found with id: " + id));
        assertCompanyCanWrite(company);

        // Only validate email if it changed
        if (!company.getEmail().equalsIgnoreCase(request.getEmail())) {
            if (companyRepository.existsByEmail(request.getEmail())) {
                throw new RuntimeException("Email is already in use by another company.");
            }
            if (employeeRepository.existsByEmail(request.getEmail())) {
                throw new RuntimeException("Email is already in use by an employee account.");
            }
        }

        company.setName(request.getName());
        company.setEmail(request.getEmail());
        company.setPhone(request.getPhone());
        company.setStreetAddress(request.getStreetAddress());
        company.setAddressLine2(request.getAddressLine2());
        company.setCity(request.getCity());
        company.setState(request.getState());
        company.setZip(request.getZip());
        company.setCountry(request.getCountry());

        return toDto(companyRepository.save(company));
    }

    public void changePassword(Long id, ChangePasswordRequest request) {
        Company company = companyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Company not found with id: " + id));
        assertCompanyCanWrite(company);

        if (!passwordEncoder.matches(request.getCurrentPassword(), company.getPwHash())) {
            throw new RuntimeException("Current password is incorrect.");
        }

        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new RuntimeException("New passwords do not match.");
        }

        company.setPwHash(passwordEncoder.encode(request.getNewPassword()));
        companyRepository.save(company);
    }

    private CompanyDto toDto(Company company) {
        CompanyPlan plan = CompanyPlan.fromCode(company.getPlanCode());
        LocalDate planStartedOn = company.getPlanStartedOn();
        LocalDate trialEndsOn = getTrialEndsOn(company);

        return new CompanyDto(
                company.getId(),
                company.getName(),
                company.getEmail(),
                company.getPhone(),
                company.getAddress(),
                company.getStreetAddress(),
                company.getAddressLine2(),
                company.getCity(),
                company.getState(),
                company.getZip(),
                company.getCountry(),
                company.getPayrollType(),
                company.getPayday(),
                company.getBiweeklyStartDate(),
                plan.getCode(),
                plan.getDisplayName(),
                plan.getEmployeeLimit(),
                planStartedOn,
                trialEndsOn,
                isTrialExpired(company),
                company.getBillingStatus(),
                company.getStripeSubscriptionStatus(),
                company.getStripeCurrentPeriodEnd()
        );
    }

    public boolean isTrialExpired(Company company) {
        CompanyPlan plan = CompanyPlan.fromCode(company.getPlanCode());
        LocalDate trialEndsOn = getTrialEndsOn(company);

        return plan.isTrial()
                && trialEndsOn != null
                && LocalDate.now().isAfter(trialEndsOn);
    }

    public void assertCompanyCanWrite(Long companyId) {
        Company company = getCompanyEntityById(companyId);
        assertCompanyCanWrite(company);
    }

    public void assertCompanyCanWrite(Company company) {
        if (hasInactiveBillingStatus(company)) {
            throw new RuntimeException(BILLING_INACTIVE_MESSAGE);
        }

        if (isTrialExpired(company)) {
            throw new RuntimeException(TRIAL_EXPIRED_MESSAGE);
        }
    }

    private boolean hasInactiveBillingStatus(Company company) {
        String billingStatus = company.getBillingStatus();
        if (billingStatus == null || billingStatus.isBlank() || "INTERNAL".equalsIgnoreCase(billingStatus)) {
            return false;
        }

        return "CANCELED".equalsIgnoreCase(billingStatus)
                || "PAST_DUE".equalsIgnoreCase(billingStatus)
                || "UNPAID".equalsIgnoreCase(billingStatus)
                || "INCOMPLETE_EXPIRED".equalsIgnoreCase(billingStatus);
    }

    public LocalDate getTrialEndsOn(Company company) {
        CompanyPlan plan = CompanyPlan.fromCode(company.getPlanCode());

        if (!plan.isTrial() || company.getPlanStartedOn() == null) {
            return null;
        }

        return company.getPlanStartedOn().plusDays(TRIAL_DAYS);
    }

    public String getMaxEmployeesMessage(CompanyPlan plan) {
        return plan == CompanyPlan.GROWING
                ? GROWING_MAX_EMPLOYEES_MESSAGE
                : MAX_EMPLOYEES_MESSAGE;
    }

    private void ensurePlanStartedOn(Company company) {
        CompanyPlan plan = CompanyPlan.fromCode(company.getPlanCode());

        if (plan.isTrial() && company.getPlanStartedOn() == null) {
            company.setPlanStartedOn(LocalDate.now());
            companyRepository.save(company);
        }
    }
}
