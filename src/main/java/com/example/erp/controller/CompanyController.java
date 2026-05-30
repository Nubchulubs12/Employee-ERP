package com.example.erp.controller;

import com.example.erp.Dto.*;
import com.example.erp.services.CompanyService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
@RestController
@RequestMapping("/api/companies")
@CrossOrigin(origins = {"http://localhost:5173","https://employee-erps.onrender.com"})
public class CompanyController {

    private final CompanyService companyService;

    public CompanyController(CompanyService companyService) {
        this.companyService = companyService;
    }
    @GetMapping
    public ResponseEntity<List<CompanyDto>> getAllCompanies() {
        return ResponseEntity.ok(companyService.getAllCompanies());
    }
    @GetMapping("/{id}")
    public ResponseEntity<CompanyDto> getCompanyById(@PathVariable Long id) {
        return ResponseEntity.ok(companyService.getCompanyById(id));
    }

    @PostMapping("/register")
   public ResponseEntity<CompanyDto> registerCompany(
           @Valid @RequestBody CreateCompanyRequest request) {
        return ResponseEntity.ok(companyService.createCompany(request));
    }
    @PutMapping("/{id}/settings")
    public ResponseEntity<CompanyDto> updateCompanySettings(
            @PathVariable Long id,
            @RequestBody UpdateCompanySettingsRequest request
    ) {
        return ResponseEntity.ok(companyService.updateCompanySettings(id, request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CompanyDto> updateCompanyInfo(
            @PathVariable Long id,
            @RequestBody UpdateCompanyInfoRequest request
    ) {
        return ResponseEntity.ok(companyService.updateCompanyInfo(id, request));
    }

    @PutMapping("/{id}/change-password")
    public ResponseEntity<Void> changePassword(
            @PathVariable Long id,
            @RequestBody ChangePasswordRequest request
    ) {
        companyService.changePassword(id, request);
        return ResponseEntity.noContent().build();
    }

}
