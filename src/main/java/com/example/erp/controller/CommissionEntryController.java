package com.example.erp.controller;

import com.example.erp.Dto.CommissionEntryDto;
import com.example.erp.Dto.SaveCommissionEntryRequest;
import com.example.erp.services.CommissionEntryService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/commissions")
@CrossOrigin(origins = {"http://localhost:5173", "https://employee-erps.onrender.com"})
public class CommissionEntryController {

    private final CommissionEntryService commissionEntryService;

    public CommissionEntryController(CommissionEntryService commissionEntryService) {
        this.commissionEntryService = commissionEntryService;
    }

    @GetMapping("/companies/{companyId}")
    public ResponseEntity<List<CommissionEntryDto>> getForCompany(
            @PathVariable Long companyId,
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate
    ) {
        return ResponseEntity.ok(commissionEntryService.getForCompany(companyId, startDate, endDate));
    }

    @GetMapping("/employees/{employeeId}")
    public ResponseEntity<List<CommissionEntryDto>> getForEmployee(
            @PathVariable Long employeeId,
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate
    ) {
        return ResponseEntity.ok(commissionEntryService.getForEmployee(employeeId, startDate, endDate));
    }

    @PostMapping("/companies/{companyId}")
    public ResponseEntity<CommissionEntryDto> create(
            @PathVariable Long companyId,
            @Valid @RequestBody SaveCommissionEntryRequest request
    ) {
        return ResponseEntity.ok(commissionEntryService.create(companyId, request));
    }

    @PutMapping("/companies/{companyId}/{entryId}")
    public ResponseEntity<CommissionEntryDto> update(
            @PathVariable Long companyId,
            @PathVariable Long entryId,
            @Valid @RequestBody SaveCommissionEntryRequest request
    ) {
        return ResponseEntity.ok(commissionEntryService.update(companyId, entryId, request));
    }

    @DeleteMapping("/companies/{companyId}/{entryId}")
    public ResponseEntity<Void> delete(@PathVariable Long companyId, @PathVariable Long entryId) {
        commissionEntryService.delete(companyId, entryId);
        return ResponseEntity.noContent().build();
    }
}
