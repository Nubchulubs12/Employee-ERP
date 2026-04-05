package com.example.erp.services;

import com.example.erp.Dto.LoginRequest;
import com.example.erp.Dto.LoginResponse;
import com.example.erp.data.CompanyRepository;
import com.example.erp.data.EmployeeRepository;
import com.example.erp.models.Company;
import com.example.erp.models.Employee;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class AuthService {

    private final CompanyRepository companyRepository;
    private final EmployeeRepository employeeRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    public AuthService(CompanyRepository companyRepository,
                       EmployeeRepository employeeRepository,
                       BCryptPasswordEncoder passwordEncoder) {
        this.companyRepository = companyRepository;
        this.employeeRepository = employeeRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public LoginResponse login(LoginRequest request) {
        Optional<Company> companyOpt = companyRepository.findByEmail(request.getEmail());

        if (companyOpt.isPresent()) {
            Company company = companyOpt.get();

            if (!passwordEncoder.matches(request.getPassword(), company.getPwHash())) {
                throw new IllegalArgumentException("Invalid email or password.");
            }

            return new LoginResponse(
                    "company",
                    company.getId(),
                    company.getName(),
                    company.getEmail(),
                    company.getId(),
                    company.getName()
            );
        }

        Optional<Employee> employeeOpt = employeeRepository.findByEmail(request.getEmail());

        if (employeeOpt.isPresent()) {
            Employee employee = employeeOpt.get();

            if (!passwordEncoder.matches(request.getPassword(), employee.getPwHash())) {
                throw new IllegalArgumentException("Invalid email or password.");
            }

            return new LoginResponse(
                    "employee",
                    employee.getId(),
                    employee.getFirstName() + " " + employee.getLastName(),
                    employee.getEmail(),
                    employee.getCompany().getId(),
                    employee.getCompany().getName()
            );
        }

        throw new IllegalArgumentException("Invalid email or password.");
    }
}