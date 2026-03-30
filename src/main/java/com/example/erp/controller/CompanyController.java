package com.example.erp.controller;

import com.example.erp.Dto.CompanyDto;
import com.example.erp.Dto.CreateCompanyRequest;
import com.example.erp.services.CompanyService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
@RestController
@RequestMapping("/api/companies")
@CrossOrigin(origins = "http://localhost:5173")
public class CompanyController {

    private final CompanyService companyService;

    public CompanyController(CompanyService companyService) {
        this.companyService = companyService;
    }

    @PostMapping("/register")
   public ResponseEntity<CompanyDto> registerCompany(
           @Valid @RequestBody CreateCompanyRequest request) {
        return ResponseEntity.ok(companyService.createCompany(request));
    }

}
