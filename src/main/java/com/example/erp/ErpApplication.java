package com.example.erp;

import com.example.erp.data.CompanyRepository;
import com.example.erp.data.EmployeeRepository;
import com.example.erp.models.Company;
import com.example.erp.models.Employee;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class ErpApplication {
    public static void main(String[] args) { SpringApplication.run(ErpApplication.class, args); }

    @Bean
    CommandLineRunner init(CompanyRepository companies, EmployeeRepository employees) {
        return args -> {
            Company acme = companies.findByName("Acme Inc").orElseGet(() -> {
                Company c = new Company(); c.setName("Acme Inc"); return companies.save(c);
            });
            if (employees.findAll().isEmpty()) {
                Employee e = new Employee();
                e.setFirstName("Jane"); e.setLastName("Doe");
                e.setEmail("jane.doe@acme.com");
                e.setCompany(acme); // required
                employees.save(e);
            }
        };
    }
}
