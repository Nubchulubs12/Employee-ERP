package com.example.erp.data;

import com.example.erp.models.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface EmployeeRepository extends JpaRepository<Employee, Long> {
    List<Employee> findByCompanyId(Long companyId);
    Optional<Employee> findByIdAndCompanyId(Long id, Long companyId);
    Optional<Employee> findByUserAccountId(Long userAccountId);
}
