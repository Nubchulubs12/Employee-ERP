package com.example.erp.controller;

import com.example.erp.Dto.DocumentDto;
import com.example.erp.models.Document;
import com.example.erp.services.DocumentService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/documents")
@CrossOrigin(origins = {"http://localhost:5173", "https://employee-erps.onrender.com"})
public class DocumentController {

    private final DocumentService documentService;

    public DocumentController(DocumentService documentService) {
        this.documentService = documentService;
    }


    @PostMapping("/company/{companyId}")
    public ResponseEntity<DocumentDto> uploadDocument(
            @PathVariable Long companyId,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "audience", required = false) String audience
    ) throws IOException {
        return ResponseEntity.ok(documentService.uploadDocument(companyId, file, audience));
    }

    @PostMapping("/company/{companyId}/audience/{audience}")
    public ResponseEntity<DocumentDto> uploadDocumentForAudience(
            @PathVariable Long companyId,
            @PathVariable String audience,
            @RequestParam("file") MultipartFile file
    ) throws IOException {
        return ResponseEntity.ok(documentService.uploadDocument(companyId, file, audience));
    }


    @GetMapping("/company/{companyId}")
    public ResponseEntity<List<DocumentDto>> getDocuments(@PathVariable Long companyId) {
        return ResponseEntity.ok(documentService.getDocumentsByCompany(companyId));
    }

    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<DocumentDto>> getEmployeeDocuments(@PathVariable Long employeeId) {
        return ResponseEntity.ok(documentService.getDocumentsByEmployee(employeeId));
    }


    @GetMapping("/{id}/download")
    public ResponseEntity<byte[]> downloadDocument(@PathVariable Long id) {
        Document document = documentService.getDocumentEntity(id);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + document.getFileName() + "\"")
                .contentType(MediaType.parseMediaType(
                        document.getFileType() != null ? document.getFileType() : "application/octet-stream"))
                .body(document.getData());
    }


    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDocument(@PathVariable Long id) {
        documentService.deleteDocument(id);
        return ResponseEntity.noContent().build();
    }
}
