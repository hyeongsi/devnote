package io.hyeongsi.devnotewebapp.post;

import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

import static org.springframework.http.HttpStatus.BAD_REQUEST;

@Component
public class PostCreateRequestValidator {

    public void validate(PostCreateRequest request) {
        if (request == null) {
            throw new ResponseStatusException(BAD_REQUEST, "Post request is required");
        }
        requireText(request.slug(), "Post slug is required");
        if (request.categoryId() == null) {
            throw new ResponseStatusException(BAD_REQUEST, "Category id is required");
        }
        requireText(request.title(), "Post title is required");
        requireText(request.excerpt(), "Post excerpt is required");
        requireText(request.readTime(), "Read time is required");
        requireText(request.thumbnailStyle(), "Thumbnail style is required");
        requireText(request.contentMarkdown(), "Content markdown is required");
        requireTags(request.tags());
    }

    public List<String> normalizeTags(List<String> tags) {
        return tags.stream()
                .map(String::trim)
                .filter(tag -> !tag.isBlank())
                .limit(10)
                .toList();
    }

    private void requireText(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new ResponseStatusException(BAD_REQUEST, message);
        }
    }

    private void requireTags(List<String> tags) {
        if (tags == null || normalizeTags(tags).isEmpty()) {
            throw new ResponseStatusException(BAD_REQUEST, "At least one tag is required");
        }
        if (tags.size() > 10) {
            throw new ResponseStatusException(BAD_REQUEST, "Tags cannot exceed 10 items");
        }
    }
}
