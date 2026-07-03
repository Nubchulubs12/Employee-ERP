package com.example.erp.controller;

import com.example.erp.Dto.CompanyMonthlyProfitDto;
import com.example.erp.Dto.UpdateCompanyMonthlyProfitRequest;
import com.example.erp.services.CompanyMonthlyProfitService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/companies/{companyId}/monthly-profits")
@CrossOrigin(origins = {"http://localhost:5173", "https://employee-erps.onrender.com"})
public class CompanyMonthlyProfitController {

    private final CompanyMonthlyProfitService monthlyProfitService;

    public CompanyMonthlyProfitController(CompanyMonthlyProfitService monthlyProfitService) {
        this.monthlyProfitService = monthlyProfitService;
    }

    @GetMapping
    public ResponseEntity<List<CompanyMonthlyProfitDto>> getYear(
            @PathVariable Long companyId,
            @RequestParam Integer year
    ) {
        return ResponseEntity.ok(monthlyProfitService.getYear(companyId, year));
    }

    @PutMapping("/{year}/{month}")
    public ResponseEntity<CompanyMonthlyProfitDto> update(
            @PathVariable Long companyId,
            @PathVariable Integer year,
            @PathVariable Integer month,
            @Valid @RequestBody UpdateCompanyMonthlyProfitRequest request
    ) {
        return ResponseEntity.ok(monthlyProfitService.update(companyId, year, month, request));
    }
}
