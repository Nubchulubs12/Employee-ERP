package com.example.erp.controller;

import com.example.erp.models.Employee;
import com.example.erp.services.EmployeeService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController @RequestMapping("/api/employees")
public class EmployeeController {
    private final EmployeeService service;
    public EmployeeController(EmployeeService service) { this.service = service; }

    @GetMapping public List<Employee> all() { return service.findAll(); }

    @PostMapping public Employee create(@RequestBody Employee e) { return service.save(e); }

    @GetMapping("/{id}")
    public ResponseEntity<Employee> one(@PathVariable Long id) {
        return service.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
