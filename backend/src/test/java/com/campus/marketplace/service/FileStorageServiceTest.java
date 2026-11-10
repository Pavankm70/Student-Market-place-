package com.campus.marketplace.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.Uploader;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.Mockito.*;

public class FileStorageServiceTest {

    private FileStorageService fileStorageService;

    @TempDir
    Path tempUploadDir;

    @BeforeEach
    void setUp() {
        fileStorageService = new FileStorageService();
        ReflectionTestUtils.setField(fileStorageService, "uploadDir", tempUploadDir.toString());
        fileStorageService.init();
    }

    @Test
    void testTwoDifferentImagesGetUniqueFilenamesAndDoNotOverwriteLocally() throws IOException {
        // Prepare two distinct image files
        byte[] imageAContent = "IMAGE_A_CONTENT_BYTES_TEST_12345".getBytes();
        byte[] imageBContent = "IMAGE_B_CONTENT_BYTES_DIFFERENT_67890".getBytes();

        MockMultipartFile fileA = new MockMultipartFile(
                "file", "product_a.png", "image/png", imageAContent);
        MockMultipartFile fileB = new MockMultipartFile(
                "file", "product_b.jpg", "image/jpeg", imageBContent);

        // Upload Product A image
        String urlA = fileStorageService.storeFile(fileA);
        // Upload Product B image
        String urlB = fileStorageService.storeFile(fileB);

        // 1. Verify URLs are not null and non-empty
        assertNotNull(urlA);
        assertNotNull(urlB);

        // 2. Verify URLs are completely unique
        assertNotEquals(urlA, urlB, "Product A and Product B must receive different URLs");

        // 3. Verify correct file extensions are preserved
        assertTrue(urlA.endsWith(".png"), "Image A should preserve .png extension");
        assertTrue(urlB.endsWith(".jpg"), "Image B should preserve .jpg extension");

        // 4. Verify both files exist on disk
        String filenameA = urlA.replace("/uploads/", "");
        String filenameB = urlB.replace("/uploads/", "");

        Path pathA = tempUploadDir.resolve(filenameA);
        Path pathB = tempUploadDir.resolve(filenameB);

        assertTrue(Files.exists(pathA), "File A must exist on disk");
        assertTrue(Files.exists(pathB), "File B must exist on disk");

        // 5. Verify contents were not overwritten and match original bytes
        byte[] readBytesA = Files.readAllBytes(pathA);
        byte[] readBytesB = Files.readAllBytes(pathB);

        assertArrayEquals(imageAContent, readBytesA, "File A content must match Image A");
        assertArrayEquals(imageBContent, readBytesB, "File B content must match Image B");
    }

    @Test
    void testUploadWithSameOriginalFilenameGetsDifferentUniqueStorageNames() {
        // Uploading two files with identical user-side names like "photo.jpg"
        MockMultipartFile file1 = new MockMultipartFile("file", "photo.jpg", "image/jpeg", "DATA1".getBytes());
        MockMultipartFile file2 = new MockMultipartFile("file", "photo.jpg", "image/jpeg", "DATA2".getBytes());

        String url1 = fileStorageService.storeFile(file1);
        String url2 = fileStorageService.storeFile(file2);

        assertNotEquals(url1, url2, "Two uploads with identical original filenames must still get different stored filenames");
    }

    @Test
    void testCloudinaryUploadReturnsSecureHttpsUrlWithUniqueId() throws IOException {
        Cloudinary mockCloudinary = mock(Cloudinary.class);
        Uploader mockUploader = mock(Uploader.class);
        when(mockCloudinary.uploader()).thenReturn(mockUploader);

        when(mockUploader.upload(any(byte[].class), anyMap())).thenAnswer(invocation -> {
            Map<?, ?> params = invocation.getArgument(1);
            String publicId = (String) params.get("public_id");
            String folder = (String) params.get("folder");
            return Map.of(
                    "secure_url", "https://res.cloudinary.com/test-cloud/image/upload/v123/" + folder + "/" + publicId + ".jpg",
                    "public_id", folder + "/" + publicId
            );
        });

        fileStorageService.setCloudinary(mockCloudinary);
        assertTrue(fileStorageService.isCloudinaryActive());
        assertEquals("Cloudinary", fileStorageService.getActiveProviderName());

        MockMultipartFile fileA = new MockMultipartFile(
                "file", "product_a.jpg", "image/jpeg", "PICTURE_A_BYTES".getBytes());
        MockMultipartFile fileB = new MockMultipartFile(
                "file", "product_b.jpg", "image/jpeg", "PICTURE_B_BYTES".getBytes());

        String urlA = fileStorageService.storeFile(fileA);
        String urlB = fileStorageService.storeFile(fileB);

        assertNotNull(urlA);
        assertNotNull(urlB);
        assertTrue(urlA.startsWith("https://res.cloudinary.com/"), "Must return secure HTTPS Cloudinary URL");
        assertTrue(urlB.startsWith("https://res.cloudinary.com/"), "Must return secure HTTPS Cloudinary URL");
        assertNotEquals(urlA, urlB, "Product A and Product B must receive different Cloudinary URLs");

        verify(mockUploader, times(2)).upload(any(byte[].class), anyMap());
    }

    @Test
    void testCloudinaryUploadFailureThrowsDescriptiveException() throws IOException {
        Cloudinary mockCloudinary = mock(Cloudinary.class);
        Uploader mockUploader = mock(Uploader.class);
        when(mockCloudinary.uploader()).thenReturn(mockUploader);
        when(mockUploader.upload(any(byte[].class), anyMap())).thenThrow(new IOException("Network timeout"));

        fileStorageService.setCloudinary(mockCloudinary);

        MockMultipartFile file = new MockMultipartFile(
                "file", "product.jpg", "image/jpeg", "TEST_BYTES".getBytes());

        RuntimeException ex = assertThrows(RuntimeException.class, () -> fileStorageService.storeFile(file));
        assertTrue(ex.getMessage().contains("Failed to upload image to persistent cloud storage"));
    }
}
