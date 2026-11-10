package com.campus.marketplace.service;

import com.campus.marketplace.exception.BadRequestException;
import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class FileStorageService {

    private static final Logger log = LoggerFactory.getLogger(FileStorageService.class);

    @Value("${app.upload.dir:./uploads}")
    private String uploadDir;

    @Value("${app.cloudinary.cloud-name:}")
    private String cloudinaryCloudName;

    @Value("${app.cloudinary.api-key:}")
    private String cloudinaryApiKey;

    @Value("${app.cloudinary.api-secret:}")
    private String cloudinaryApiSecret;

    @Value("${app.cloudinary.url:}")
    private String cloudinaryUrl;

    private Cloudinary cloudinary;
    private Path rootLocation;
    private static final List<String> ALLOWED_EXTENSIONS = Arrays.asList(".jpg", ".jpeg", ".png", ".webp", ".gif");

    @PostConstruct
    public void init() {
        // Initialize local root location (always available as fallback)
        try {
            this.rootLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
            Files.createDirectories(this.rootLocation);
        } catch (IOException e) {
            log.warn("[STORAGE-INIT] Could not initialize local upload directory: {}", e.getMessage());
        }

        initializeCloudinaryIfConfigured();
    }

    public void initializeCloudinaryIfConfigured() {
        if (this.cloudinary != null) {
            return;
        }

        String url = StringUtils.hasText(cloudinaryUrl) ? cloudinaryUrl.trim() : System.getenv("CLOUDINARY_URL");
        String cloudName = StringUtils.hasText(cloudinaryCloudName) ? cloudinaryCloudName.trim() : System.getenv("CLOUDINARY_CLOUD_NAME");
        String apiKey = StringUtils.hasText(cloudinaryApiKey) ? cloudinaryApiKey : System.getenv("CLOUDINARY_API_KEY");
        String apiSecret = StringUtils.hasText(cloudinaryApiSecret) ? cloudinaryApiSecret : System.getenv("CLOUDINARY_API_SECRET");

        if (StringUtils.hasText(url)) {
            this.cloudinary = new Cloudinary(url.trim());
            log.info("[STORAGE-INIT] Persistent Cloudinary storage initialized via CLOUDINARY_URL.");
        } else if (StringUtils.hasText(cloudName) && StringUtils.hasText(apiKey) && StringUtils.hasText(apiSecret)) {
            Map<String, Object> config = new HashMap<>();
            config.put("cloud_name", cloudName.trim());
            config.put("api_key", apiKey.trim());
            config.put("api_secret", apiSecret.trim());
            config.put("secure", true);
            this.cloudinary = new Cloudinary(config);
            log.info("[STORAGE-INIT] Persistent Cloudinary storage initialized successfully (cloud_name='{}').", cloudName.trim());
        } else {
            log.info("[STORAGE-INIT] Cloudinary credentials not configured. Using local filesystem storage at: {}", this.rootLocation);
        }
    }

    public boolean isCloudinaryActive() {
        return this.cloudinary != null;
    }

    public String getActiveProviderName() {
        return isCloudinaryActive() ? "Cloudinary" : "LocalFileSystem";
    }

    public void setCloudinary(Cloudinary cloudinary) {
        this.cloudinary = cloudinary;
    }

    public Cloudinary getCloudinary() {
        return this.cloudinary;
    }

    public String storeFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Uploaded file cannot be empty");
        }

        String originalFilename = StringUtils.cleanPath(file.getOriginalFilename() != null ? file.getOriginalFilename() : "upload.jpg");

        // Validate extension
        String extension = "";
        int extIndex = originalFilename.lastIndexOf(".");
        if (extIndex >= 0) {
            extension = originalFilename.substring(extIndex).toLowerCase();
        }

        if (extension.isEmpty() && file.getContentType() != null) {
            String ct = file.getContentType().toLowerCase();
            if (ct.contains("jpeg") || ct.contains("jpg")) extension = ".jpg";
            else if (ct.contains("png")) extension = ".png";
            else if (ct.contains("webp")) extension = ".webp";
            else if (ct.contains("gif")) extension = ".gif";
        }

        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new BadRequestException("Invalid file type: " + extension + ". Allowed types: JPG, JPEG, PNG, WEBP, GIF");
        }

        // Generate safe collision-resistant unique identifier
        String uniqueId = UUID.randomUUID().toString();

        if (isCloudinaryActive()) {
            return uploadToCloudinary(file, uniqueId, originalFilename);
        } else {
            return storeLocally(file, uniqueId, extension, originalFilename);
        }
    }

    private String uploadToCloudinary(MultipartFile file, String uniqueId, String originalFilename) {
        try {
            log.info("[STORAGE-UPLOAD] Starting Cloudinary upload. uniqueId='{}', originalFilename='{}', contentType='{}', size={} bytes",
                    uniqueId, originalFilename, file.getContentType(), file.getSize());

            Map<?, ?> uploadParams = ObjectUtils.asMap(
                    "folder", "campus-marketplace/listings",
                    "public_id", uniqueId,
                    "resource_type", "image",
                    "overwrite", false
            );

            Map<?, ?> uploadResult = this.cloudinary.uploader().upload(file.getBytes(), uploadParams);
            String secureUrl = (String) uploadResult.get("secure_url");
            if (!StringUtils.hasText(secureUrl)) {
                secureUrl = (String) uploadResult.get("url");
            }

            if (!StringUtils.hasText(secureUrl)) {
                throw new RuntimeException("Cloudinary response did not contain a valid URL");
            }

            log.info("[STORAGE-STORED] provider='Cloudinary', uniqueId='{}', returnedUrl='{}'", uniqueId, secureUrl);
            return secureUrl;
        } catch (Exception e) {
            log.error("[STORAGE-ERROR] Cloudinary upload failed for uniqueId='{}': {}", uniqueId, e.getMessage());
            throw new RuntimeException("Failed to upload image to persistent cloud storage: " + e.getMessage(), e);
        }
    }

    private String storeLocally(MultipartFile file, String uniqueId, String extension, String originalFilename) {
        String storedFileName = uniqueId + extension;
        Path destinationFile = this.rootLocation.resolve(storedFileName).normalize();

        // Security check against directory traversal
        if (!destinationFile.getParent().equals(this.rootLocation)) {
            throw new BadRequestException("Cannot store file outside current directory.");
        }

        try {
            if (!Files.exists(this.rootLocation)) {
                Files.createDirectories(this.rootLocation);
            }
            try (InputStream inputStream = file.getInputStream()) {
                Files.copy(inputStream, destinationFile, StandardCopyOption.REPLACE_EXISTING);
                String relativeUrl = "/uploads/" + storedFileName;
                log.info("[STORAGE-STORED] provider='LocalFileSystem', originalFilename='{}', generatedFilename='{}', contentType='{}', storedPath='{}', returnedUrl='{}'",
                        originalFilename, storedFileName, file.getContentType(), destinationFile, relativeUrl);
                return relativeUrl;
            }
        } catch (IOException e) {
            log.error("[STORAGE-ERROR] Local storage failed for originalFilename='{}': {}", originalFilename, e.getMessage());
            throw new RuntimeException("Failed to store file locally: " + originalFilename, e);
        }
    }
}
