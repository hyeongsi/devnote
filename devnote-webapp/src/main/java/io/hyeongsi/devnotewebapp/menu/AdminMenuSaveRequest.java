package io.hyeongsi.devnotewebapp.menu;

public record AdminMenuSaveRequest(
        Long id,
        String name,
        String path,
        String state,
        Boolean visible,
        Integer displayOrder,
        String area,
        Long parentId
) {
}
