package io.hyeongsi.devnotewebapp.category;

public record AdminCategorySaveRequest(
        Long id,
        String slug,
        String name,
        String description,
        Boolean visible,
        Integer displayOrder
) {
}
