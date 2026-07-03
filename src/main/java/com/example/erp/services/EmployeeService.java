package com.example.erp.services;

import com.example.erp.Dto.*;
import com.example.erp.data.CompanyRepository;
import com.example.erp.models.Company;
import com.example.erp.models.CompanyPlan;
import com.example.erp.models.Employee;
import com.example.erp.data.EmployeeRepository;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
public class EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final CompanyRepository companyRepository;
    private final CompanyService companyService;
    private final BCryptPasswordEncoder passwordEncoder;

    public EmployeeService(EmployeeRepository employeeRepository,
                           CompanyRepository companyRepository,
                           CompanyService companyService,
                           BCryptPasswordEncoder passwordEncoder) {
        this.employeeRepository = employeeRepository;
        this.companyRepository = companyRepository;
        this.companyService = companyService;
        this.passwordEncoder = passwordEncoder;
    }


    private void validateEmailUnique(String email, Long excludeEmployeeId) {
        if (excludeEmployeeId != null) {

            boolean takenByOtherEmployee = employeeRepository.findAll().stream()
                    .filter(e -> !e.getId().equals(excludeEmployeeId))
                    .anyMatch(e -> e.getEmail().equalsIgnoreCase(email));
            if (takenByOtherEmployee) {
                throw new RuntimeException("Email is already in use by another employee.");
            }
        } else {

            if (employeeRepository.existsByEmail(email)) {
                throw new RuntimeException("Email is already in use by another employee.");
            }
        }

        if (companyRepository.existsByEmail(email)) {
            throw new RuntimeException("Email is already in use by a company account.");
        }
    }

    public List<EmployeeDto> getAllEmployees() {
        return employeeRepository.findAll()
                .stream()
                .map(this::toDto)
                .toList();
    }

    public EmployeeDto getEmployeeById(Long id) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Employee not found with id: " + id));
        return toDto(employee);
    }

    public Employee getEmployeeEntityById(Long id) {
        return employeeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Employee not found with id: " + id));
    }

    public EmployeeDto createEmployee(CreateEmployeeRequest request) {
        validateEmailUnique(request.getEmail(), null);

        Company company = companyService.getCompanyEntityById(request.getCompanyId());
        CompanyPlan plan = CompanyPlan.fromCode(company.getPlanCode());
        long currentEmployeeCount = employeeRepository.countByCompanyId(company.getId());

        if (companyService.isTrialExpired(company)) {
            throw new RuntimeException(CompanyService.TRIAL_EXPIRED_MESSAGE);
        }

        if (currentEmployeeCount >= plan.getEmployeeLimit()) {
            throw new RuntimeException(companyService.getMaxEmployeesMessage(plan));
        }

        Employee employee = new Employee();
        employee.setFirstName(request.getFirstName());
        employee.setLastName(request.getLastName());
        employee.setEmail(request.getEmail());
        employee.setJobTitle(request.getJobTitle());
        employee.setHireDate(request.getHireDate());
        employee.setCompany(company);
        employee.setPwHash(passwordEncoder.encode(request.getPassword()));
        employee.setPayType(request.getPayType() != null ? request.getPayType() : "HOURLY");
        employee.setHourlyRate(request.getHourlyRate());
        employee.setSalaryRate(request.getSalaryRate());
        employee.setCommissionPercentage(normalizeCommissionPercentage(
                employee.getPayType(),
                request.getCommissionPercentage()
        ));
        employee.setPtoBalanceHours(request.getPtoBalanceHours() == null ? BigDecimal.ZERO : request.getPtoBalanceHours());

        return toDto(employeeRepository.save(employee));
    }

    public EmployeeDto updateEmployee(Long id, UpdateEmployeeRequest request) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Employee not found with id: " + id));


        if (!employee.getEmail().equalsIgnoreCase(request.getEmail())) {
            validateEmailUnique(request.getEmail(), id);
        }

        employee.setFirstName(request.getFirstName());
        employee.setLastName(request.getLastName());
        employee.setEmail(request.getEmail());
        employee.setJobTitle(request.getJobTitle());
        employee.setHireDate(request.getHireDate());
        employee.setPayType(request.getPayType() != null ? request.getPayType() : "HOURLY");
        employee.setHourlyRate(request.getHourlyRate());
        employee.setSalaryRate(request.getSalaryRate());
        employee.setCommissionPercentage(normalizeCommissionPercentage(
                employee.getPayType(),
                request.getCommissionPercentage()
        ));
        employee.setPtoBalanceHours(request.getPtoBalanceHours() == null ? BigDecimal.ZERO : request.getPtoBalanceHours());

        if (request.getNewPassword() != null && !request.getNewPassword().isBlank()) {
            employee.setPwHash(passwordEncoder.encode(request.getNewPassword()));
        }

        return toDto(employeeRepository.save(employee));
    }

    public EmployeeDto updateEmployeeProfile(Long id, UpdateEmployeeProfileRequest request) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Employee not found with id: " + id));

        employee.setPhone(request.getPhone());
        employee.setStreetAddress(request.getStreetAddress());
        employee.setAddressLine2(request.getAddressLine2());
        employee.setCity(request.getCity());
        employee.setState(request.getState());
        employee.setZip(request.getZip());
        employee.setCountry(request.getCountry());
        employee.setEmergencyContact(request.getEmergencyContact());
        employee.setEmergencyPhone(request.getEmergencyPhone());

        return toDto(employeeRepository.save(employee));
    }

    public void deleteEmployee(Long id) {
        if (!employeeRepository.existsById(id)) {
            throw new RuntimeException("Employee not found with id: " + id);
        }
        employeeRepository.deleteById(id);
    }

    public List<EmployeeDto> getEmployeeByCompanyId(Long companyId) {
        return employeeRepository.findByCompanyId(companyId)
                .stream()
                .map(this::toDto)
                .toList();
    }

    public void changePassword(Long id, ChangePasswordRequest request) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Employee not found with id: " + id));

        if (!passwordEncoder.matches(request.getCurrentPassword(), employee.getPwHash())) {
            throw new RuntimeException("Current password is incorrect.");
        }

        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new RuntimeException("New passwords do not match.");
        }

        employee.setPwHash(passwordEncoder.encode(request.getNewPassword()));
        employeeRepository.save(employee);
    }

    private EmployeeDto toDto(Employee employee) {
        return new EmployeeDto(
                employee.getId(),
                employee.getFirstName(),
                employee.getLastName(),
                employee.getEmail(),
                employee.getJobTitle(),
                employee.getHireDate(),
                employee.getCompany().getId(),
                employee.getCompany().getName(),
                employee.getHourlyRate(),
                employee.getSalaryRate(),
                employee.getPayType(),
                employee.getCommissionPercentage(),
                employee.getPtoBalanceHours(),
                employee.getPhone(),
                employee.getStreetAddress(),
                employee.getAddressLine2(),
                employee.getCity(),
                employee.getState(),
                employee.getZip(),
                employee.getCountry(),
                employee.getEmergencyContact(),
                employee.getEmergencyPhone()
        );
    }

    private BigDecimal normalizeCommissionPercentage(String payType, BigDecimal commissionPercentage) {
        if (!"CONTRACT_1099".equals(payType)) {
            return null;
        }

        if (commissionPercentage != null
                && (commissionPercentage.compareTo(BigDecimal.ZERO) < 0
                || commissionPercentage.compareTo(BigDecimal.valueOf(100)) > 0)) {
            throw new IllegalArgumentException("Commission percentage must be between 0 and 100.");
        }

        return commissionPercentage;
    }
}
