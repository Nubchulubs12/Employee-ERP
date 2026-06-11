package com.example.erp.data;

import com.example.erp.Dto.DocumentDto;
import com.example.erp.models.Document;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface DocumentRepository extends JpaRepository<Document, Long> {

    @Query("""
        SELECT new com.example.erp.Dto.DocumentDto(
            d.id,
            d.fileName,
            d.fileType,
            d.fileSize,
            d.uploadedAt,
            d.company.id
        )
        FROM Document d
        WHERE d.company.id = :companyId
        ORDER BY d.uploadedAt DESC
    """)
    List<DocumentDto> findDocumentDtosByCompanyId(Long companyId);
}