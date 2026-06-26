package com.example.erp.data;

import com.example.erp.models.AccountType;
import com.example.erp.models.PasswordResetCode;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PasswordResetCodeRepository extends JpaRepository<PasswordResetCode, Long> {
    Optional<PasswordResetCode> findTopByEmailIgnoreCaseAndAccountTypeAndUsedFalseOrderByCreatedAtDesc(
            String email,
            AccountType accountType
    );
}
