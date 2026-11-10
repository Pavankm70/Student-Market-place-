package com.campus.marketplace.service;

import com.campus.marketplace.dto.BookLookupResponseDto;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

@Service
public class ExternalBookService {

    private static final Logger log = LoggerFactory.getLogger(ExternalBookService.class);

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${app.external.google-books-api:https://www.googleapis.com/books/v1/volumes}")
    private String googleBooksApiUrl;

    @Value("${app.external.google-books-key:}")
    private String googleBooksApiKey;

    public ExternalBookService(RestTemplateBuilder restTemplateBuilder, ObjectMapper objectMapper) {
        this.restTemplate = restTemplateBuilder
                .setConnectTimeout(Duration.ofSeconds(6))
                .setReadTimeout(Duration.ofSeconds(6))
                .build();
        this.objectMapper = objectMapper;
    }

    public List<BookLookupResponseDto> searchBooks(String query) {
        if (query == null || query.trim().isEmpty()) {
            return new ArrayList<>();
        }

        String trimmedQuery = query.trim();
        List<BookLookupResponseDto> results = new ArrayList<>();

        // 1. Try Google Books API first
        try {
            results = queryGoogleBooks(trimmedQuery);
            if (!results.isEmpty()) {
                return results;
            }
        } catch (ResourceAccessException e) {
            log.warn("Google Books API connection timed out or unreachable: {}", e.getMessage());
        } catch (RestClientResponseException e) {
            log.warn("Google Books API responded with HTTP error {}: {}", e.getStatusCode(), e.getMessage());
        } catch (Exception e) {
            log.warn("Unexpected error querying Google Books API: {}", e.getMessage());
        }

        // 2. Fallback to OpenLibrary API if Google Books didn't return results
        try {
            results = queryOpenLibrary(trimmedQuery);
        } catch (Exception e) {
            log.warn("OpenLibrary fallback failed: {}", e.getMessage());
        }

        return results;
    }

    private List<BookLookupResponseDto> queryGoogleBooks(String query) {
        List<BookLookupResponseDto> bookList = new ArrayList<>();

        // If query looks like an ISBN (digits and hyphens)
        String cleanIsbn = query.replaceAll("[^0-9X]", "");
        String searchParam = (cleanIsbn.length() == 10 || cleanIsbn.length() == 13)
                ? "isbn:" + cleanIsbn
                : query;

        // Defensive normalization in case API key was passed as URL
        String effectiveUrl = googleBooksApiUrl;
        String effectiveKey = googleBooksApiKey;
        if (effectiveUrl != null && !effectiveUrl.startsWith("http://") && !effectiveUrl.startsWith("https://")) {
            if (effectiveKey == null || effectiveKey.isBlank()) {
                effectiveKey = effectiveUrl.trim();
            }
            effectiveUrl = "https://www.googleapis.com/books/v1/volumes";
        }

        UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(effectiveUrl)
                .queryParam("q", searchParam)
                .queryParam("maxResults", "8")
                .queryParam("printType", "books");

        if (effectiveKey != null && !effectiveKey.isBlank()) {
            builder.queryParam("key", effectiveKey.trim());
        }

        String url = builder.toUriString();

        ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);
        if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
            return bookList;
        }

        try {
            JsonNode root = objectMapper.readTree(response.getBody());
            JsonNode items = root.path("items");

            if (items.isArray()) {
                for (JsonNode item : items) {
                    JsonNode volumeInfo = item.path("volumeInfo");
                    BookLookupResponseDto dto = new BookLookupResponseDto();

                    dto.setTitle(volumeInfo.path("title").asText(null));
                    if (dto.getTitle() == null) {
                        continue;
                    }

                    // Authors
                    List<String> authors = new ArrayList<>();
                    JsonNode authorsNode = volumeInfo.path("authors");
                    if (authorsNode.isArray()) {
                        for (JsonNode a : authorsNode) {
                            authors.add(a.asText());
                        }
                    }
                    dto.setAuthors(authors);
                    dto.setAuthor(authors.isEmpty() ? "Unknown Author" : String.join(", ", authors));

                    // Publisher & Date
                    dto.setPublisher(volumeInfo.path("publisher").asText(null));
                    dto.setPublishedDate(volumeInfo.path("publishedDate").asText(null));
                    dto.setDescription(volumeInfo.path("description").asText(null));
                    dto.setPageCount(volumeInfo.has("pageCount") ? volumeInfo.path("pageCount").asInt() : null);

                    // ISBN
                    JsonNode identifiers = volumeInfo.path("industryIdentifiers");
                    if (identifiers.isArray()) {
                        for (JsonNode idNode : identifiers) {
                            String type = idNode.path("type").asText("");
                            String identifier = idNode.path("identifier").asText(null);
                            if ("ISBN_13".equalsIgnoreCase(type) || dto.getIsbn() == null) {
                                dto.setIsbn(identifier);
                            }
                        }
                    }

                    // Cover Image
                    JsonNode imageLinks = volumeInfo.path("imageLinks");
                    if (imageLinks.has("thumbnail")) {
                        String thumb = imageLinks.path("thumbnail").asText();
                        dto.setCoverImageUrl(thumb.replace("http://", "https://"));
                    } else if (imageLinks.has("smallThumbnail")) {
                        String thumb = imageLinks.path("smallThumbnail").asText();
                        dto.setCoverImageUrl(thumb.replace("http://", "https://"));
                    }

                    // Categories
                    List<String> categories = new ArrayList<>();
                    JsonNode categoriesNode = volumeInfo.path("categories");
                    if (categoriesNode.isArray()) {
                        for (JsonNode c : categoriesNode) {
                            categories.add(c.asText());
                        }
                    }
                    dto.setCategories(categories);

                    bookList.add(dto);
                }
            }
        } catch (Exception e) {
            log.error("Failed to parse Google Books response: {}", e.getMessage());
        }

        return bookList;
    }

    private List<BookLookupResponseDto> queryOpenLibrary(String query) {
        List<BookLookupResponseDto> bookList = new ArrayList<>();
        String url = UriComponentsBuilder.fromHttpUrl("https://openlibrary.org/search.json")
                .queryParam("q", query)
                .queryParam("limit", "5")
                .toUriString();

        ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);
        if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
            return bookList;
        }

        try {
            JsonNode root = objectMapper.readTree(response.getBody());
            JsonNode docs = root.path("docs");

            if (docs.isArray()) {
                for (JsonNode doc : docs) {
                    BookLookupResponseDto dto = new BookLookupResponseDto();
                    dto.setTitle(doc.path("title").asText(null));
                    if (dto.getTitle() == null) continue;

                    List<String> authors = new ArrayList<>();
                    JsonNode authorName = doc.path("author_name");
                    if (authorName.isArray()) {
                        for (JsonNode a : authorName) {
                            authors.add(a.asText());
                        }
                    }
                    dto.setAuthors(authors);
                    dto.setAuthor(authors.isEmpty() ? "Unknown Author" : String.join(", ", authors));

                    // First ISBN
                    JsonNode isbnNode = doc.path("isbn");
                    if (isbnNode.isArray() && isbnNode.size() > 0) {
                        dto.setIsbn(isbnNode.get(0).asText());
                    }

                    // Publisher
                    JsonNode pubNode = doc.path("publisher");
                    if (pubNode.isArray() && pubNode.size() > 0) {
                        dto.setPublisher(pubNode.get(0).asText());
                    }

                    // Cover Image by cover_i
                    if (doc.has("cover_i")) {
                        long coverI = doc.path("cover_i").asLong();
                        dto.setCoverImageUrl("https://covers.openlibrary.org/b/id/" + coverI + "-M.jpg");
                    }

                    bookList.add(dto);
                }
            }
        } catch (Exception e) {
            log.error("Failed to parse OpenLibrary response: {}", e.getMessage());
        }

        return bookList;
    }
}
