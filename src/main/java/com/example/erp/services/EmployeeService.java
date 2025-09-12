package com.example.erp.services;

import com.example.erp.data.EmployeeRepository;
import com.example.erp.models.Employee;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class EmployeeService {
    private final EmployeeRepository repo;
    public EmployeeService(EmployeeRepository repo) { this.repo = repo; }
    public List<Employee> findAll() { return repo.findAll(); }
    public Employee save(Employee e) { return repo.save(e); }
    public Optional<Employee> findById(Long id) { return repo.findById(id); }
    public void delete(Long id) { repo.deleteById(id); }
}
