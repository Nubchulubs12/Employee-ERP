package com.example.erp.controller;

import com.example.erp.Dto.CompanyMonthlyJobDto;
import com.example.erp.Dto.SaveCompanyMonthlyJobRequest;
import com.example.erp.services.CompanyMonthlyJobService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/companies/{companyId}/monthly-profit-jobs")
@CrossOrigin(origins = {"http://localhost:5173", "https://employee-erps.onrender.com"})
public class CompanyMonthlyJobController {

    private final CompanyMonthlyJobService monthlyJobService;

    public CompanyMonthlyJobController(CompanyMonthlyJobService monthlyJobService) {
        this.monthlyJobService = monthlyJobService;
    }

    @GetMapping
    public ResponseEntity<List<CompanyMonthlyJobDto>> getYear(
            @PathVariable Long companyId,
            @RequestParam Integer year
    ) {
        return ResponseEntity.ok(monthlyJobService.getYear(companyId, year));
    }

    @PostMapping("/{year}/{month}")
    public ResponseEntity<CompanyMonthlyJobDto> create(
            @PathVariable Long companyId,
            @PathVariable Integer year,
            @PathVariable Integer month,
            @Valid @RequestBody SaveCompanyMonthlyJobRequest request
    ) {
        return ResponseEntity.ok(monthlyJobService.create(companyId, year, month, request));
    }

    @PutMapping("/{jobId}")
    public ResponseEntity<CompanyMonthlyJobDto> update(
            @PathVariable Long companyId,
            @PathVariable Long jobId,
            @Valid @RequestBody SaveCompanyMonthlyJobRequest request
    ) {
        return ResponseEntity.ok(monthlyJobService.update(companyId, jobId, request));
    }

    @DeleteMapping("/{jobId}")
    public ResponseEntity<Void> delete(
            @PathVariable Long companyId,
            @PathVariable Long jobId
    ) {
        monthlyJobService.delete(companyId, jobId);
        return ResponseEntity.noContent().build();
    }
}
