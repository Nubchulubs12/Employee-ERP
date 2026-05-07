package com.example.erp.controller;

import com.example.erp.Dto.CreatePtoRequest;
import com.example.erp.Dto.PtoRequestDto;
import com.example.erp.Dto.ReviewPtoRequest;
import com.example.erp.services.PtoRequestService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pto")
@CrossOrigin(origins = {"http://localhost:5173","https://employee-erps.onrender.com"})
public class PtoRequestController {

    private final PtoRequestService ptoRequestService;

    public PtoRequestController(PtoRequestService ptoRequestService) {
        this.ptoRequestService = ptoRequestService;
    }

    @PostMapping("/employees/{employeeId}")
    public ResponseEntity<PtoRequestDto> createRequest(
            @PathVariable Long employeeId,
            @Valid @RequestBody CreatePtoRequest request
    ) {
        return ResponseEntity.ok(ptoRequestService.createRequest(employeeId, request));
    }

    @GetMapping("/employees/{employeeId}")
    public ResponseEntity<List<PtoRequestDto>> getRequestsForEmployee(@PathVariable Long employeeId) {
        return ResponseEntity.ok(ptoRequestService.getRequestsForEmployee(employeeId));
    }

    @GetMapping("/company/{companyId}")
    public ResponseEntity<List<PtoRequestDto>> getRequestsForCompany(@PathVariable Long companyId) {
        return ResponseEntity.ok(ptoRequestService.getRequestsForCompany(companyId));
    }

    @PutMapping("/{requestId}/approve")
    public ResponseEntity<PtoRequestDto> approveRequest(
            @PathVariable Long requestId,
            @RequestBody ReviewPtoRequest request
    ) {
        return ResponseEntity.ok(ptoRequestService.approveRequest(requestId, request));
    }

    @PutMapping("/{requestId}/deny")
    public ResponseEntity<PtoRequestDto> denyRequest(
            @PathVariable Long requestId,
            @RequestBody ReviewPtoRequest request
    ) {
        return ResponseEntity.ok(ptoRequestService.denyRequest(requestId, request));
    }
}