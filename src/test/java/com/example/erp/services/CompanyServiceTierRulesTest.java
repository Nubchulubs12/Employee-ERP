package com.example.erp.services;

import com.example.erp.Dto.CompanyDto;
import com.example.erp.Dto.UpdateCompanyPlanRequest;
import com.example.erp.data.CompanyRepository;
import com.example.erp.data.EmployeeRepository;
import com.example.erp.models.Company;
import com.example.erp.models.CompanyPlan;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CompanyServiceTierRulesTest {

    @Mock
    private CompanyRepository companyRepository;

    @Mock
    private EmployeeRepository employeeRepository;

    @Mock
    private BCryptPasswordEncoder passwordEncoder;

    private CompanyService companyService;

    @BeforeEach
    void setUp() {
        companyService = new CompanyService(companyRepository, employeeRepository, passwordEncoder);
    }

    @Test
    void updateCompanyPlanBlocksPlanWithLowerEmployeeLimitThanCurrentEmployeeCount() {
        Company company = company(1L, CompanyPlan.GROWING, LocalDate.now());
        UpdateCompanyPlanRequest request = planRequest(CompanyPlan.SMALL);

        when(companyRepository.findById(company.getId())).thenReturn(Optional.of(company));
        when(employeeRepository.countByCompanyId(company.getId())).thenReturn(26L);

        RuntimeException exception = assertThrows(
                RuntimeException.class,
                () -> companyService.updateCompanyPlan(company.getId(), request)
        );

        assertEquals(CompanyService.MAX_EMPLOYEES_MESSAGE, exception.getMessage());
        verify(companyRepository, never()).save(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void updateCompanyPlanAllowsGrowingAtOneHundredEmployees() {
        Company company = company(1L, CompanyPlan.SMALL, LocalDate.now());
        UpdateCompanyPlanRequest request = planRequest(CompanyPlan.GROWING);

        when(companyRepository.findById(company.getId())).thenReturn(Optional.of(company));
        when(employeeRepository.countByCompanyId(company.getId())).thenReturn(100L);
        when(companyRepository.save(company)).thenReturn(company);

        CompanyDto updated = companyService.updateCompanyPlan(company.getId(), request);

        assertEquals(CompanyPlan.GROWING.getCode(), updated.getPlanCode());
        assertEquals(CompanyPlan.GROWING.getEmployeeLimit(), updated.getEmployeeLimit());
        assertNull(updated.getTrialEndsOn());
        assertFalse(updated.getTrialExpired());
    }

    @Test
    void trialExpirationIsThirtyDaysAfterPlanStart() {
        Company company = company(1L, CompanyPlan.TRIAL, LocalDate.now().minusDays(30));

        assertEquals(LocalDate.now(), companyService.getTrialEndsOn(company));
        assertFalse(companyService.isTrialExpired(company));

        company.setPlanStartedOn(LocalDate.now().minusDays(31));

        assertTrue(companyService.isTrialExpired(company));
    }

    private Company company(Long id, CompanyPlan plan, LocalDate planStartedOn) {
        Company company = new Company();
        company.setId(id);
        company.setName("Test Company");
        company.setEmail("company@example.com");
        company.setPlanCode(plan.getCode());
        company.setPlanStartedOn(planStartedOn);
        return company;
    }

    private UpdateCompanyPlanRequest planRequest(CompanyPlan plan) {
        UpdateCompanyPlanRequest request = new UpdateCompanyPlanRequest();
        request.setPlanCode(plan.getCode());
        return request;
    }
}
