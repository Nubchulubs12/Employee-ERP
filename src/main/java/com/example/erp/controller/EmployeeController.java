package com.example.erp.controller;
import com.example.erp.Dto.ChangePasswordRequest;
import com.example.erp.Dto.CreateEmployeeRequest;
import com.example.erp.Dto.EmployeeDto;
import com.example.erp.Dto.UpdateEmployeeRequest;
import com.example.erp.services.EmployeeService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/employees")
@CrossOrigin(origins = "http://localhost:5173")
public class EmployeeController {

    private final EmployeeService employeeService;

    public EmployeeController(EmployeeService employeeService) {
        this.employeeService = employeeService;
    }

    @GetMapping("/company/{companyId}")
    public ResponseEntity<List<EmployeeDto>> getEmployeeByCompanyId(@PathVariable Long companyId) {
        return ResponseEntity.ok(employeeService.getEmployeeByCompanyId(companyId));
    }

    @PostMapping
    public ResponseEntity<EmployeeDto> createEmployee(@Valid @RequestBody CreateEmployeeRequest request) {
        return ResponseEntity.ok(employeeService.createEmployee(request));
    }
    @PutMapping("/{id}")
    public ResponseEntity<EmployeeDto> updateEmployee(@PathVariable Long id, @RequestBody UpdateEmployeeRequest request) {
        EmployeeDto updateEmployee = employeeService.updateEmployee(id, request);
        return ResponseEntity.ok(updateEmployee);
    }
    @PutMapping("/{id}/change-password")
    public ResponseEntity<String> changePassword(@PathVariable Long id, @RequestBody ChangePasswordRequest request) {
        employeeService.changePassword(id, request);
        return ResponseEntity.ok("Password update successfully");
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEmployee(@PathVariable Long id) {
        employeeService.deleteEmployee(id);
        return ResponseEntity.noContent().build();
    }
}