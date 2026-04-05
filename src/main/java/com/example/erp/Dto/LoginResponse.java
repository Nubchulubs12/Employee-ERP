package com.example.erp.Dto;

public class LoginResponse {
    private String userType;
    private Long id;
    private String name;
    private String email;
    private Long companyId;
    private String companyName;

    public LoginResponse(String userType, Long id, String name, String email, Long companyId, String companyName) {
        this.userType = userType;
        this.id = id;
        this.name = name;
        this.email = email;
        this.companyId = companyId;
        this.companyName = companyName;
    }

    public String getUserType() {
        return userType;
    }

    public void setUserType(String userType) {
        this.userType = userType;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public Long getCompanyId() {
        return companyId;
    }

    public void setCompanyId(Long companyId) {
        this.companyId = companyId;
    }

    public String getCompanyName() {
        return companyName;
    }

    public void setCompanyName(String companyName) {
        this.companyName = companyName;
    }
}
