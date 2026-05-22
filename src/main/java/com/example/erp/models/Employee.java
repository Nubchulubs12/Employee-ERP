package com.example.erp.models;

import java.math.BigDecimal;
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
    @Column(name = "jobTitle")
    private String jobTitle;
    @Column(name = "hireDate")
    private LocalDate hireDate;
    @Column(name = "hourlyRate")
    private BigDecimal hourlyRate;
    @Column(name = "ptoBalanceHours")
    private BigDecimal ptoBalanceHours;
    @Column(name = "payType")
    private String payType;
    @Column(name = "salaryRate")
    private BigDecimal salaryRate;

private String phone;
    @Column(name = "streetAddress")
    private String streetAddress;
    @Column(name = "addressLine2")
    private String addressLine2;
private String city;
private String state;
private String zip;
private String country;
    @Column(name = "emergencyContact")
    private String emergencyContact;
    @Column(name = "emergencyPhone")
    private String emergencyPhone;

@ManyToOne(fetch = FetchType.EAGER, optional = false)
@JoinColumn(name = "company_id", nullable = false)
private Company company;

    public String getPayType() {
        return payType;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getStreetAddress() {
        return streetAddress;
    }

    public void setStreetAddress(String streetAddress) {
        this.streetAddress = streetAddress;
    }

    public String getAddressLine2() {
        return addressLine2;
    }

    public void setAddressLine2(String addressLine2) {
        this.addressLine2 = addressLine2;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getState() {
        return state;
    }

    public void setState(String state) {
        this.state = state;
    }

    public String getZip() {
        return zip;
    }

    public void setZip(String zip) {
        this.zip = zip;
    }

    public String getCountry() {
        return country;
    }

    public void setCountry(String country) {
        this.country = country;
    }

    public String getEmergencyContact() {
        return emergencyContact;
    }

    public void setEmergencyContact(String emergencyContact) {
        this.emergencyContact = emergencyContact;
    }

    public String getEmergencyPhone() {
        return emergencyPhone;
    }

    public void setEmergencyPhone(String emergencyPhone) {
        this.emergencyPhone = emergencyPhone;
    }

    public void setPayType(String payType) {
        this.payType = payType;
    }

    public BigDecimal getSalaryRate() {
        return salaryRate;
    }

    public void setSalaryRate(BigDecimal salaryRate) {
        this.salaryRate = salaryRate;
    }

    public Employee() {
}

public Long getId() {
    return id;
}

public void setId(Long id) {
    this.id = id;
}

    public BigDecimal getPtoBalanceHours() {
        return ptoBalanceHours;
    }

    public void setPtoBalanceHours(BigDecimal ptoBalanceHours) {
        this.ptoBalanceHours = ptoBalanceHours;
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

    public BigDecimal getHourlyRate() {
        return hourlyRate;
    }

    public void setHourlyRate(BigDecimal hourlyRate) {
        this.hourlyRate = hourlyRate;
    }
}