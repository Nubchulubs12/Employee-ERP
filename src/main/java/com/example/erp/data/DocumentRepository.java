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
            d.company.id,
            COALESCE(d.audience, 'ALL')
        )
        FROM Document d
        WHERE d.company.id = :companyId
        ORDER BY d.uploadedAt DESC
    """)
    List<DocumentDto> findDocumentDtosByCompanyId(Long companyId);

    @Query("""
        SELECT new com.example.erp.Dto.DocumentDto(
            d.id,
            d.fileName,
            d.fileType,
            d.fileSize,
            d.uploadedAt,
            d.company.id,
            COALESCE(d.audience, 'ALL')
        )
        FROM Document d
        WHERE d.company.id = :companyId
          AND (
            COALESCE(d.audience, 'ALL') = 'ALL'
            OR COALESCE(d.audience, 'ALL') = :audience
          )
        ORDER BY d.uploadedAt DESC
    """)
    List<DocumentDto> findDocumentDtosByCompanyIdAndAudience(Long companyId, String audience);
}
