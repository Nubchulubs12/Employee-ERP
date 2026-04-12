package com.example.erp.controller;

import com.example.erp.Dto.LoginRequest;
import com.example.erp.Dto.LoginResponse;
import com.example.erp.services.AuthService;
import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = {"http://localhost:5173","https://employee-erps.onrender.com"})
public class AuthController {
    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService= authService;
    }
    @PostMapping("/login")
    public ResponseEntity<LoginResponse>login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }
}
