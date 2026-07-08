package com.example.erp.services;

import com.example.erp.Dto.ForgotPasswordRequest;
import com.example.erp.Dto.ResetPasswordRequest;
import com.example.erp.Dto.VerifyResetCodeRequest;
import com.example.erp.data.CompanyRepository;
import com.example.erp.data.EmployeeRepository;
import com.example.erp.data.PasswordResetCodeRepository;
import com.example.erp.models.AccountType;
import com.example.erp.models.Company;
import com.example.erp.models.Employee;
import com.example.erp.models.PasswordResetCode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Locale;
import java.util.Optional;

@Service
public class PasswordResetService {

    private static final Logger logger = LoggerFactory.getLogger(PasswordResetService.class);

    public static final String GENERIC_REQUEST_MESSAGE =
            "If an account exists for that email, a reset code has been sent.";

    private final CompanyRepository companyRepository;
    private final EmployeeRepository employeeRepository;
    private final PasswordResetCodeRepository passwordResetCodeRepository;
    private final BCryptPasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final CompanyService companyService;
    private final SecureRandom secureRandom = new SecureRandom();

    public PasswordResetService(CompanyRepository companyRepository,
                                EmployeeRepository employeeRepository,
                                PasswordResetCodeRepository passwordResetCodeRepository,
                                BCryptPasswordEncoder passwordEncoder,
                                EmailService emailService,
                                CompanyService companyService) {
        this.companyRepository = companyRepository;
        this.employeeRepository = employeeRepository;
        this.passwordResetCodeRepository = passwordResetCodeRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
        this.companyService = companyService;
    }

    @Transactional
    public String requestCode(ForgotPasswordRequest request) {
        String email = normalizeEmail(request.getEmail());

        if (!accountExists(email, request.getAccountType())) {
            return GENERIC_REQUEST_MESSAGE;
        }

        String code = String.valueOf(secureRandom.nextInt(90000) + 10000);

        PasswordResetCode resetCode = new PasswordResetCode();
        resetCode.setEmail(email);
        resetCode.setAccountType(request.getAccountType());
        resetCode.setCodeHash(passwordEncoder.encode(code));
        resetCode.setExpiresAt(LocalDateTime.now().plusMinutes(15));
        resetCode.setUsed(false);
        passwordResetCodeRepository.save(resetCode);

        try {
            emailService.sendPasswordResetCode(email, code);
        } catch (RuntimeException ex) {
            logger.warn("Password reset email could not be sent for account type {}", request.getAccountType(), ex);
        }

        return GENERIC_REQUEST_MESSAGE;
    }

    @Transactional(readOnly = true)
    public void verifyCode(VerifyResetCodeRequest request) {
        validateCode(normalizeEmail(request.getEmail()), request.getAccountType(), request.getCode());
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        String email = normalizeEmail(request.getEmail());
        PasswordResetCode resetCode = validateCode(email, request.getAccountType(), request.getCode());
        String encodedPassword = passwordEncoder.encode(request.getNewPassword());

        if (request.getAccountType() == AccountType.COMPANY) {
            Company company = companyRepository.findByEmail(email)
                    .orElseThrow(() -> new IllegalArgumentException("Invalid or expired reset code."));
            companyService.assertCompanyCanWrite(company);
            company.setPwHash(encodedPassword);
            companyRepository.save(company);
        } else {
            Employee employee = employeeRepository.findByEmail(email)
                    .orElseThrow(() -> new IllegalArgumentException("Invalid or expired reset code."));
            companyService.assertCompanyCanWrite(employee.getCompany());
            employee.setPwHash(encodedPassword);
            employeeRepository.save(employee);
        }

        resetCode.setUsed(true);
        passwordResetCodeRepository.save(resetCode);
    }

    private PasswordResetCode validateCode(String email, AccountType accountType, String code) {
        Optional<PasswordResetCode> resetCodeOpt =
                passwordResetCodeRepository.findTopByEmailIgnoreCaseAndAccountTypeAndUsedFalseOrderByCreatedAtDesc(
                        email,
                        accountType
                );

        PasswordResetCode resetCode = resetCodeOpt
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired reset code."));

        if (resetCode.isUsed() || resetCode.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Invalid or expired reset code.");
        }

        if (!passwordEncoder.matches(code, resetCode.getCodeHash())) {
            throw new IllegalArgumentException("Invalid or expired reset code.");
        }

        return resetCode;
    }

    private boolean accountExists(String email, AccountType accountType) {
        if (accountType == AccountType.COMPANY) {
            return companyRepository.existsByEmail(email);
        }

        return employeeRepository.existsByEmail(email);
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
