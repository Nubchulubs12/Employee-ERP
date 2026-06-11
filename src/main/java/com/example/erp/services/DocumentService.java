package com.example.erp.services;

import com.example.erp.Dto.DocumentDto;
import com.example.erp.data.DocumentRepository;
import com.example.erp.models.Company;
import com.example.erp.models.Document;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@Service
public class DocumentService {

    private final DocumentRepository documentRepository;
    private final CompanyService companyService;

    public DocumentService(DocumentRepository documentRepository, CompanyService companyService) {
        this.documentRepository = documentRepository;
        this.companyService = companyService;
    }

    public DocumentDto uploadDocument(Long companyId, MultipartFile file) throws IOException {
        Company company = companyService.getCompanyEntityById(companyId);

        Document document = new Document();
        document.setFileName(file.getOriginalFilename());
        document.setFileType(file.getContentType());
        document.setFileSize(file.getSize());
        document.setData(file.getBytes());
        document.setCompany(company);

        return toDto(documentRepository.save(document));
    }

    public List<DocumentDto> getDocumentsByCompany(Long companyId) {
        return documentRepository.findDocumentDtosByCompanyId(companyId);
    }

    public Document getDocumentEntity(Long id) {
        return documentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Document not found with id: " + id));
    }

    public void deleteDocument(Long id) {
        if (!documentRepository.existsById(id)) {
            throw new RuntimeException("Document not found with id: " + id);
        }
        documentRepository.deleteById(id);
    }

    private DocumentDto toDto(Document document) {
        return new DocumentDto(
                document.getId(),
                document.getFileName(),
                document.getFileType(),
                document.getFileSize(),
                document.getUploadedAt(),
                document.getCompany().getId()
        );
    }
}