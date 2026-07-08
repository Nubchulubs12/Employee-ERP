package com.example.erp.services;

import com.example.erp.Dto.CommissionEntryDto;
import com.example.erp.Dto.SaveCommissionEntryRequest;
import com.example.erp.data.CommissionEntryRepository;
import com.example.erp.data.CompanyRepository;
import com.example.erp.data.EmployeeRepository;
import com.example.erp.models.CommissionEntry;
import com.example.erp.models.Company;
import com.example.erp.models.Employee;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class CommissionEntryService {

    private final CommissionEntryRepository commissionEntryRepository;
    private final CompanyRepository companyRepository;
    private final EmployeeRepository employeeRepository;
    private final CompanyService companyService;

    public CommissionEntryService(
            CommissionEntryRepository commissionEntryRepository,
            CompanyRepository companyRepository,
            EmployeeRepository employeeRepository,
            CompanyService companyService
    ) {
        this.commissionEntryRepository = commissionEntryRepository;
        this.companyRepository = companyRepository;
        this.employeeRepository = employeeRepository;
        this.companyService = companyService;
    }

    public CommissionEntryDto create(Long companyId, SaveCommissionEntryRequest request) {
        Company company = getCompany(companyId);
        companyService.assertCompanyCanWrite(company);
        Employee employee = getCompanyEmployee(companyId, request.getEmployeeId());
        CommissionEntry entry = new CommissionEntry();
        entry.setCompany(company);
        entry.setEmployee(employee);
        apply(entry, request);
        return toDto(commissionEntryRepository.save(entry));
    }

    public CommissionEntryDto update(Long companyId, Long entryId, SaveCommissionEntryRequest request) {
        CommissionEntry entry = getCompanyEntry(companyId, entryId);
        companyService.assertCompanyCanWrite(entry.getCompany());
        entry.setEmployee(getCompanyEmployee(companyId, request.getEmployeeId()));
        apply(entry, request);
        return toDto(commissionEntryRepository.save(entry));
    }

    public void delete(Long companyId, Long entryId) {
        CommissionEntry entry = getCompanyEntry(companyId, entryId);
        companyService.assertCompanyCanWrite(entry.getCompany());
        commissionEntryRepository.delete(entry);
    }

    public List<CommissionEntryDto> getForCompany(Long companyId, LocalDate startDate, LocalDate endDate) {
        getCompany(companyId);
        validateDateRange(startDate, endDate);
        List<CommissionEntry> entries = startDate == null
                ? commissionEntryRepository.findByCompanyIdOrderByDateEarnedDescIdDesc(companyId)
                : commissionEntryRepository.findByCompanyIdAndDateEarnedBetweenOrderByDateEarnedAscIdAsc(
                        companyId, startDate, endDate);
        return entries.stream().map(this::toDto).toList();
    }

    public List<CommissionEntryDto> getForEmployee(Long employeeId, LocalDate startDate, LocalDate endDate) {
        employeeRepository.findById(employeeId)
                .orElseThrow(() -> new IllegalArgumentException("Employee not found with id: " + employeeId));
        validateDateRange(startDate, endDate);
        List<CommissionEntry> entries = startDate == null
                ? commissionEntryRepository.findByEmployeeIdOrderByDateEarnedDescIdDesc(employeeId)
                : commissionEntryRepository.findByEmployeeIdAndDateEarnedBetweenOrderByDateEarnedAscIdAsc(
                        employeeId, startDate, endDate);
        return entries.stream().map(this::toDto).toList();
    }

    private void apply(CommissionEntry entry, SaveCommissionEntryRequest request) {
        entry.setDescription(request.getDescription().trim());
        entry.setAmount(request.getAmount());
        entry.setDateEarned(request.getDateEarned());
        entry.setNotes(request.getNotes() == null || request.getNotes().isBlank() ? null : request.getNotes().trim());
    }

    private void validateDateRange(LocalDate startDate, LocalDate endDate) {
        if ((startDate == null) != (endDate == null)) {
            throw new IllegalArgumentException("Both startDate and endDate are required when filtering commissions.");
        }
        if (startDate != null && endDate.isBefore(startDate)) {
            throw new IllegalArgumentException("Commission endDate cannot be before startDate.");
        }
    }

    private Company getCompany(Long companyId) {
        return companyRepository.findById(companyId)
                .orElseThrow(() -> new IllegalArgumentException("Company not found with id: " + companyId));
    }

    private Employee getCompanyEmployee(Long companyId, Long employeeId) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new IllegalArgumentException("Employee not found with id: " + employeeId));
        if (!employee.getCompany().getId().equals(companyId)) {
            throw new IllegalArgumentException("Employee does not belong to this company.");
        }
        return employee;
    }

    private CommissionEntry getCompanyEntry(Long companyId, Long entryId) {
        CommissionEntry entry = commissionEntryRepository.findById(entryId)
                .orElseThrow(() -> new IllegalArgumentException("Commission entry not found with id: " + entryId));
        if (!entry.getCompany().getId().equals(companyId)) {
            throw new IllegalArgumentException("Commission entry does not belong to this company.");
        }
        return entry;
    }

    private CommissionEntryDto toDto(CommissionEntry entry) {
        Employee employee = entry.getEmployee();
        return new CommissionEntryDto(
                entry.getId(), employee.getId(),
                (employee.getFirstName() + " " + employee.getLastName()).trim(),
                entry.getCompany().getId(), entry.getDescription(), entry.getAmount(),
                entry.getDateEarned(), entry.getNotes());
    }
}
