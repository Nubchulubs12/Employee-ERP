package com.example.erp.models;

import java.time.LocalDate;

import jakarta.persistence.*;

@Entity
@Table(name = "employees")
public class Employee {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

@Column(nullable = false)
private String firstName;

@Column(nullable = false)
private String lastName;

@Column(nullable = false, unique = true)
private String email;

@Column(nullable = false)
private String pwHash;
private String jobTitle;
private LocalDate hireDate;

@ManyToOne(fetch = FetchType.EAGER, optional = false)
@JoinColumn(name = "company_id", nullable = false)
private Company company;

public Employee() {
}

public Long getId() {
    return id;
}

public void setId(Long id) {
    this.id = id;
}

public String getFirstName() {
    return firstName;
}

public void setFirstName(String firstName) {
    this.firstName = firstName;
}

public String getLastName() {
    return lastName;
}

public void setLastName(String lastName) {
    this.lastName = lastName;
}

public String getEmail() {
    return email;
}

public void setEmail(String email) {
    this.email = email;
}

public String getJobTitle() {
    return jobTitle;
}

public void setJobTitle(String jobTitle) {
    this.jobTitle = jobTitle;
}

public LocalDate getHireDate() {
    return hireDate;
}

public void setHireDate(LocalDate hireDate) {
    this.hireDate = hireDate;
}

public Company getCompany() {
    return company;
}

public void setCompany(Company company) {
    this.company = company;
}

    public String getPwHash() {
        return pwHash;
    }

    public void setPwHash(String pwHash) {
        this.pwHash = pwHash;
    }
}