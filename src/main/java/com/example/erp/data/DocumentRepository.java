package com.example.erp.data;

import com.example.erp.models.Document;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DocumentRepository extends JpaRepository<Document, Long> {
    List<Document> findByCompanyIdOrderByUploadedAtDesc(Long companyId);
}