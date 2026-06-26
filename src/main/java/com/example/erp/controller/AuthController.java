package com.example.erp.controller;

import com.example.erp.Dto.LoginRequest;
import com.example.erp.Dto.LoginResponse;
import com.example.erp.Dto.ForgotPasswordRequest;
import com.example.erp.Dto.ResetPasswordRequest;
import com.example.erp.Dto.VerifyResetCodeRequest;
import com.example.erp.services.AuthService;
import com.example.erp.services.PasswordResetService;
import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = {"http://localhost:5173","https://employee-erps.onrender.com"})
public class AuthController {
    private final AuthService authService;
    private final PasswordResetService passwordResetService;

    public AuthController(AuthService authService, PasswordResetService passwordResetService) {
        this.authService= authService;
        this.passwordResetService = passwordResetService;
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse>login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/forgot-password/request-code")
    public ResponseEntity<String> requestPasswordResetCode(@Valid @RequestBody ForgotPasswordRequest request) {
        return ResponseEntity.ok(passwordResetService.requestCode(request));
    }

    @PostMapping("/forgot-password/verify-code")
    public ResponseEntity<String> verifyPasswordResetCode(@Valid @RequestBody VerifyResetCodeRequest request) {
        passwordResetService.verifyCode(request);
        return ResponseEntity.ok("Reset code verified.");
    }

    @PostMapping("/forgot-password/reset")
    public ResponseEntity<String> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        passwordResetService.resetPassword(request);
        return ResponseEntity.ok("Password reset successfully.");
    }
}
