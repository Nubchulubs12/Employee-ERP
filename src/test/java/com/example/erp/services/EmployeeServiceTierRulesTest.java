package com.example.erp.services;

import com.example.erp.Dto.CreateEmployeeRequest;
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
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EmployeeServiceTierRulesTest {

    @Mock
    private EmployeeRepository employeeRepository;

    @Mock
    private CompanyRepository companyRepository;

    @Mock
    private BCryptPasswordEncoder passwordEncoder;

    @Mock
    private EmailService emailService;

    private CompanyService companyService;
    private EmployeeService employeeService;

    @BeforeEach
    void setUp() {
        companyService = new CompanyService(companyRepository, employeeRepository, passwordEncoder, emailService);
        employeeService = new EmployeeService(
                employeeRepository,
                companyRepository,
                companyService,
                passwordEncoder
        );
    }

    @Test
    void trialPlanCannotAddMoreThanTenEmployees() {
        Company company = company(1L, CompanyPlan.TRIAL, LocalDate.now());
        CreateEmployeeRequest request = employeeRequest(company.getId());

        when(employeeRepository.existsByEmail(request.getEmail())).thenReturn(false);
        when(companyRepository.existsByEmail(request.getEmail())).thenReturn(false);
        when(companyRepository.findById(company.getId())).thenReturn(Optional.of(company));
        when(employeeRepository.countByCompanyId(company.getId())).thenReturn(10L);

        RuntimeException exception = assertThrows(
                RuntimeException.class,
                () -> employeeService.createEmployee(request)
        );

        assertEquals(CompanyService.MAX_EMPLOYEES_MESSAGE, exception.getMessage());
        verify(employeeRepository, never()).save(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void smallPlanCannotAddMoreThanTwentyFiveEmployees() {
        Company company = company(1L, CompanyPlan.SMALL, LocalDate.now());
        CreateEmployeeRequest request = employeeRequest(company.getId());

        when(employeeRepository.existsByEmail(request.getEmail())).thenReturn(false);
        when(companyRepository.existsByEmail(request.getEmail())).thenReturn(false);
        when(companyRepository.findById(company.getId())).thenReturn(Optional.of(company));
        when(employeeRepository.countByCompanyId(company.getId())).thenReturn(25L);

        RuntimeException exception = assertThrows(
                RuntimeException.class,
                () -> employeeService.createEmployee(request)
        );

        assertEquals(CompanyService.MAX_EMPLOYEES_MESSAGE, exception.getMessage());
        verify(employeeRepository, never()).save(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void growingPlanCannotAddMoreThanOneHundredEmployees() {
        Company company = company(1L, CompanyPlan.GROWING, LocalDate.now());
        CreateEmployeeRequest request = employeeRequest(company.getId());

        when(employeeRepository.existsByEmail(request.getEmail())).thenReturn(false);
        when(companyRepository.existsByEmail(request.getEmail())).thenReturn(false);
        when(companyRepository.findById(company.getId())).thenReturn(Optional.of(company));
        when(employeeRepository.countByCompanyId(company.getId())).thenReturn(100L);

        RuntimeException exception = assertThrows(
                RuntimeException.class,
                () -> employeeService.createEmployee(request)
        );

        assertEquals(CompanyService.GROWING_MAX_EMPLOYEES_MESSAGE, exception.getMessage());
        verify(employeeRepository, never()).save(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void expiredTrialCannotAddEmployeesEvenBelowEmployeeLimit() {
        Company company = company(1L, CompanyPlan.TRIAL, LocalDate.now().minusDays(31));
        CreateEmployeeRequest request = employeeRequest(company.getId());

        when(employeeRepository.existsByEmail(request.getEmail())).thenReturn(false);
        when(companyRepository.existsByEmail(request.getEmail())).thenReturn(false);
        when(companyRepository.findById(company.getId())).thenReturn(Optional.of(company));
        when(employeeRepository.countByCompanyId(company.getId())).thenReturn(3L);

        RuntimeException exception = assertThrows(
                RuntimeException.class,
                () -> employeeService.createEmployee(request)
        );

        assertEquals(CompanyService.TRIAL_EXPIRED_MESSAGE, exception.getMessage());
        verify(employeeRepository, never()).save(org.mockito.ArgumentMatchers.any());
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

    private CreateEmployeeRequest employeeRequest(Long companyId) {
        CreateEmployeeRequest request = new CreateEmployeeRequest();
        request.setCompanyId(companyId);
        request.setFirstName("Avery");
        request.setLastName("Employee");
        request.setEmail("avery@example.com");
        request.setPassword("password");
        return request;
    }
}
