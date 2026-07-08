package com.example.erp.services;

import com.example.erp.Dto.CommissionEntryDto;
import com.example.erp.Dto.SaveCommissionEntryRequest;
import com.example.erp.data.CommissionEntryRepository;
import com.example.erp.data.CompanyRepository;
import com.example.erp.data.EmployeeRepository;
import com.example.erp.models.CommissionEntry;
import com.example.erp.models.Company;
import com.example.erp.models.Employee;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class CommissionEntryServiceTest {

    private CommissionEntryRepository commissionRepository;
    private CompanyRepository companyRepository;
    private EmployeeRepository employeeRepository;
    private CompanyService companyService;
    private CommissionEntryService service;
    private Company company;
    private Employee employee;

    @BeforeEach
    void setUp() {
        commissionRepository = mock(CommissionEntryRepository.class);
        companyRepository = mock(CompanyRepository.class);
        employeeRepository = mock(EmployeeRepository.class);
        companyService = mock(CompanyService.class);
        service = new CommissionEntryService(
                commissionRepository,
                companyRepository,
                employeeRepository,
                companyService
        );

        company = new Company();
        company.setId(7L);
        employee = new Employee();
        employee.setId(11L);
        employee.setFirstName("Avery");
        employee.setLastName("Jones");
        employee.setCompany(company);
    }

    @Test
    void createsEntryForEmployeeAndCompanyWithoutStoringAPayPeriod() {
        when(companyRepository.findById(7L)).thenReturn(Optional.of(company));
        when(employeeRepository.findById(11L)).thenReturn(Optional.of(employee));
        when(commissionRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        CommissionEntryDto result = service.create(7L, request(LocalDate.of(2026, 6, 30)));

        ArgumentCaptor<CommissionEntry> captor = ArgumentCaptor.forClass(CommissionEntry.class);
        verify(commissionRepository).save(captor.capture());
        assertSame(company, captor.getValue().getCompany());
        assertSame(employee, captor.getValue().getEmployee());
        assertEquals(LocalDate.of(2026, 6, 30), result.dateEarned());
        assertEquals(new BigDecimal("250.00"), result.amount());
    }

    @Test
    void movingDateUpdatesTheSameEntry() {
        CommissionEntry entry = new CommissionEntry();
        entry.setCompany(company);
        entry.setEmployee(employee);
        entry.setDescription("Old");
        entry.setAmount(BigDecimal.ONE);
        entry.setDateEarned(LocalDate.of(2026, 6, 20));
        when(commissionRepository.findById(3L)).thenReturn(Optional.of(entry));
        when(employeeRepository.findById(11L)).thenReturn(Optional.of(employee));
        when(commissionRepository.save(entry)).thenReturn(entry);

        CommissionEntryDto result = service.update(7L, 3L, request(LocalDate.of(2026, 7, 1)));

        assertEquals(LocalDate.of(2026, 7, 1), result.dateEarned());
        verify(commissionRepository).save(entry);
    }

    @Test
    void selectedPayrollDatesAreAppliedToCompanyQuery() {
        LocalDate start = LocalDate.of(2026, 6, 22);
        LocalDate end = LocalDate.of(2026, 6, 28);
        when(companyRepository.findById(7L)).thenReturn(Optional.of(company));
        when(commissionRepository.findByCompanyIdAndDateEarnedBetweenOrderByDateEarnedAscIdAsc(7L, start, end))
                .thenReturn(List.of());

        assertTrue(service.getForCompany(7L, start, end).isEmpty());
        verify(commissionRepository)
                .findByCompanyIdAndDateEarnedBetweenOrderByDateEarnedAscIdAsc(7L, start, end);
        verify(commissionRepository, never()).findByCompanyIdOrderByDateEarnedDescIdDesc(7L);
    }

    @Test
    void rejectsEmployeeFromAnotherCompany() {
        Company other = new Company();
        other.setId(99L);
        employee.setCompany(other);
        when(companyRepository.findById(7L)).thenReturn(Optional.of(company));
        when(employeeRepository.findById(11L)).thenReturn(Optional.of(employee));

        assertThrows(IllegalArgumentException.class, () -> service.create(7L, request(LocalDate.now())));
        verify(commissionRepository, never()).save(any());
    }

    private SaveCommissionEntryRequest request(LocalDate dateEarned) {
        SaveCommissionEntryRequest request = new SaveCommissionEntryRequest();
        request.setEmployeeId(11L);
        request.setDescription("Sales commission");
        request.setAmount(new BigDecimal("250.00"));
        request.setDateEarned(dateEarned);
        request.setNotes("Quarter-end sale");
        return request;
    }
}
