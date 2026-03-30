package com.example.erp.services;

import com.example.erp.Dto.CreateEmployeeRequest;
import com.example.erp.Dto.EmployeeDto;
import com.example.erp.Dto.UpdateEmployeeRequest;
import com.example.erp.models.Company;
import com.example.erp.models.Employee;
import com.example.erp.data.EmployeeRepository;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final CompanyService companyService;
    private final BCryptPasswordEncoder passwordEncoder;

    public EmployeeService(EmployeeRepository employeeRepository, CompanyService companyService, BCryptPasswordEncoder passwordEncoder) {
        this.employeeRepository = employeeRepository;
        this.companyService = companyService;
        this.passwordEncoder = passwordEncoder;

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

    public EmployeeDto createEmployee(CreateEmployeeRequest request) {
        if (employeeRepository.existsByEmail(request.getEmail())){
            throw new RuntimeException("Employee email already exists.");
        }
        Company company = companyService.getCompanyEntityById(request.getCompanyId());

        Employee employee = new Employee();
        employee.setFirstName(request.getFirstName());
        employee.setLastName(request.getLastName());
        employee.setEmail(request.getEmail());
        employee.setJobTitle(request.getJobTitle());
        employee.setHireDate(request.getHireDate());
        employee.setCompany(company);
        employee.setPwHash(passwordEncoder.encode(request.getPassword()));

        return toDto(employeeRepository.save(employee));
    }

    public EmployeeDto updateEmployee(Long id, UpdateEmployeeRequest request) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Employee not found with id: " + id));

        Company company = companyService.getCompanyEntityById(request.getCompanyId());

        employee.setFirstName(request.getFirstName());
        employee.setLastName(request.getLastName());
        employee.setEmail(request.getEmail());
        employee.setJobTitle(request.getJobTitle());
        employee.setHireDate(request.getHireDate());
        employee.setCompany(company);

        return toDto(employeeRepository.save(employee));
    }

    public void deleteEmployee(Long id) {
        if (!employeeRepository.existsById(id)) {
            throw new RuntimeException("Employee not found with id: " + id);
        }

        employeeRepository.deleteById(id);
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
                employee.getCompany().getName()
        );
    }
}