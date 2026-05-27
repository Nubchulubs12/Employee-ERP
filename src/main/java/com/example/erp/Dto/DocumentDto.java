package com.example.erp.Dto;

import java.time.LocalDateTime;

public class DocumentDto {
    private Long id;
    private String fileName;
    private String fileType;
    private Long fileSize;
    private LocalDateTime uploadedAt;
    private Long companyId;

    public DocumentDto() {}

    public DocumentDto(Long id, String fileName, String fileType,
                       Long fileSize, LocalDateTime uploadedAt, Long companyId) {
        this.id = id;
        this.fileName = fileName;
        this.fileType = fileType;
        this.fileSize = fileSize;
        this.uploadedAt = uploadedAt;
        this.companyId = companyId;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }

    public String getFileType() { return fileType; }
    public void setFileType(String fileType) { this.fileType = fileType; }

    public Long getFileSize() { return fileSize; }
    public void setFileSize(Long fileSize) { this.fileSize = fileSize; }

    public LocalDateTime getUploadedAt() { return uploadedAt; }
    public void setUploadedAt(LocalDateTime uploadedAt) { this.uploadedAt = uploadedAt; }

    public Long getCompanyId() { return companyId; }
    public void setCompanyId(Long companyId) { this.companyId = companyId; }
}