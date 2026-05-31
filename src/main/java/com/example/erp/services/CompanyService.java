package com.example.erp.services;

import com.example.erp.Dto.*;
import com.example.erp.data.EmployeeRepository;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import com.example.erp.models.Company;
import com.example.erp.data.CompanyRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CompanyService {

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
        return toDto(company);
    }

    public Company getCompanyEntityById(Long id) {
        return companyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Company not found with id: " + id));
    }

    public CompanyDto updateCompanySettings(Long id, UpdateCompanySettingsRequest request) {
        Company company = companyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Company not found with id: " + id));

        company.setPayrollType(request.getPayrollType());
        company.setPayday(request.getPayday());
        company.setBiweeklyStartDate(request.getBiweeklyStartDate());

        return toDto(companyRepository.save(company));
    }

    public CompanyDto updateCompanyInfo(Long id, UpdateCompanyInfoRequest request) {
        Company company = companyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Company not found with id: " + id));

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
                company.getBiweeklyStartDate()
        );
    }
}