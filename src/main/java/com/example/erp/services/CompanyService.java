package com.example.erp.services;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import com.example.erp.Dto.CompanyDto;
import com.example.erp.Dto.CreateCompanyRequest;
import com.example.erp.models.Company;
import com.example.erp.data.CompanyRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CompanyService {

    private final CompanyRepository companyRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    public CompanyService(CompanyRepository companyRepository, BCryptPasswordEncoder passwordEncoder) {
        this.companyRepository = companyRepository;
        this.passwordEncoder = passwordEncoder;

    }

    public List<CompanyDto> getAllCompanies() {
        return companyRepository.findAll()
                .stream()
                .map(this::toDto)
                .toList();
    }

    public CompanyDto createCompany(CreateCompanyRequest request) {
        Company company = new Company();
        company.setName(request.getName());
        company.setEmail(request.getEmail());
        company.setPhone(request.getPhone());
        company.setAddress(request.getAddress());
        company.setPwHash(passwordEncoder.encode(request.getPassword()));

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

    private CompanyDto toDto(Company company) {
        return new CompanyDto(
                company.getId(),
                company.getName(),
                company.getEmail(),
                company.getPhone(),
                company.getAddress()
        );
    }
}