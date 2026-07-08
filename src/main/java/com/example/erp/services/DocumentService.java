package com.example.erp.services;

import com.example.erp.Dto.DocumentDto;
import com.example.erp.data.DocumentRepository;
import com.example.erp.models.Company;
import com.example.erp.models.Document;
import com.example.erp.models.Employee;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@Service
public class DocumentService {
    private static final String AUDIENCE_ALL = "ALL";
    private static final String AUDIENCE_W2_EMPLOYEES = "W2_EMPLOYEES";
    private static final String AUDIENCE_1099 = "CONTRACT_1099";

    private final DocumentRepository documentRepository;
    private final CompanyService companyService;
    private final EmployeeService employeeService;

    public DocumentService(DocumentRepository documentRepository,
                           CompanyService companyService,
                           EmployeeService employeeService) {
        this.documentRepository = documentRepository;
        this.companyService = companyService;
        this.employeeService = employeeService;
    }

    public DocumentDto uploadDocument(Long companyId, MultipartFile file, String audience) throws IOException {
        Company company = companyService.getCompanyEntityById(companyId);
        companyService.assertCompanyCanWrite(company);

        Document document = new Document();
        document.setFileName(file.getOriginalFilename());
        document.setFileType(file.getContentType());
        document.setFileSize(file.getSize());
        document.setData(file.getBytes());
        document.setAudience(normalizeAudience(audience));
        document.setCompany(company);

        return toDto(documentRepository.save(document));
    }

    public List<DocumentDto> getDocumentsByCompany(Long companyId) {
        return documentRepository.findDocumentDtosByCompanyId(companyId);
    }

    public List<DocumentDto> getDocumentsByEmployee(Long employeeId) {
        Employee employee = employeeService.getEmployeeEntityById(employeeId);
        String audience = "CONTRACT_1099".equals(employee.getPayType())
                ? AUDIENCE_1099
                : AUDIENCE_W2_EMPLOYEES;

        return documentRepository.findDocumentDtosByCompanyIdAndAudience(
                employee.getCompany().getId(),
                audience
        );
    }

    public Document getDocumentEntity(Long id) {
        return documentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Document not found with id: " + id));
    }

    public void deleteDocument(Long id) {
        Document document = getDocumentEntity(id);
        companyService.assertCompanyCanWrite(document.getCompany());
        documentRepository.delete(document);
    }

    private DocumentDto toDto(Document document) {
        return new DocumentDto(
                document.getId(),
                document.getFileName(),
                document.getFileType(),
                document.getFileSize(),
                document.getUploadedAt(),
                document.getCompany().getId(),
                normalizeAudience(document.getAudience())
        );
    }

    private String normalizeAudience(String audience) {
        String normalizedAudience = audience == null ? "" : audience.trim().toUpperCase();
        if (AUDIENCE_W2_EMPLOYEES.equals(normalizedAudience) || AUDIENCE_1099.equals(normalizedAudience)) {
            return normalizedAudience;
        }

        return AUDIENCE_ALL;
    }
}
