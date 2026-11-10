package com.campus.marketplace.controller;

import com.campus.marketplace.service.FileStorageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping({"/api/upload", "/api/uploads"})
@Tag(name = "Image Upload", description = "Upload listing images")
public class FileUploadController {

    private static final Logger log = LoggerFactory.getLogger(FileUploadController.class);

    private final FileStorageService fileStorageService;

    public FileUploadController(FileStorageService fileStorageService) {
        this.fileStorageService = fileStorageService;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload a product image")
    public ResponseEntity<Map<String, String>> uploadFile(@RequestParam("file") MultipartFile file) {
        log.info("[UPLOAD-REQUEST] originalFilename='{}', contentType='{}', size={} bytes",
                file.getOriginalFilename(), file.getContentType(), file.getSize());
        String fileUrl = fileStorageService.storeFile(file);
        log.info("[UPLOAD-RESPONSE] provider='{}', returnedUrl='{}'",
                fileStorageService.getActiveProviderName(), fileUrl);
        return ResponseEntity.ok(Map.of("url", fileUrl));
    }
}
