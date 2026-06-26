package com.example.erp.Dto;

import com.example.erp.models.AccountType;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

public class VerifyResetCodeRequest {

    @NotBlank
    @Email
    private String email;

    @NotNull
    private AccountType accountType;

    @NotBlank
    @Pattern(regexp = "\\d{5}", message = "Reset code must be 5 digits.")
    private String code;

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public AccountType getAccountType() {
        return accountType;
    }

    public void setAccountType(AccountType accountType) {
        this.accountType = accountType;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }
}
