package io.hyeongsi.devnotewebapp.post;

import org.springframework.stereotype.Component;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;

@Component
public class PostResponseMapper {

    private static final DateTimeFormatter DISPLAY_DATE_FORMAT = DateTimeFormatter.ofPattern("yyyy.MM.dd");

    public PostResponse toSummaryResponse(Post post) {
        return new PostResponse(
                post.getId(),
                post.getSlug(),
                post.getCategoryName(),
                post.getCategorySlug(),
                post.getTitle(),
                post.getExcerpt(),
                post.getPublishedAt().format(DISPLAY_DATE_FORMAT),
                post.getReadTime(),
                post.getViewCount(),
                post.getTags(),
                post.getThumbnailStyle()
        );
    }

    public PostDetailResponse toDetailResponse(Post post) {
        return new PostDetailResponse(
                post.getId(),
                post.getSlug(),
                post.getCategoryName(),
                post.getCategorySlug(),
                post.getTitle(),
                post.getExcerpt(),
                post.getPublishedAt().format(DISPLAY_DATE_FORMAT),
                post.getReadTime(),
                post.getViewCount(),
                post.getTags(),
                post.getThumbnailStyle(),
                post.getContentMarkdown()
        );
    }

    public PostSearchResponse toSearchResponse(Post post, String normalizedQuery) {
        return new PostSearchResponse(
                post.getId(),
                post.getSlug(),
                post.getCategoryName(),
                post.getCategorySlug(),
                post.getTitle(),
                post.getExcerpt(),
                post.getPublishedAt().format(DISPLAY_DATE_FORMAT),
                findMatchedText(post, normalizedQuery)
        );
    }

    private String findMatchedText(Post post, String normalizedQuery) {
        List<String> candidates = List.of(
                post.getContentMarkdown(),
                post.getExcerpt(),
                post.getTitle(),
                post.getCategoryName(),
                String.join(", ", post.getTags())
        );

        return candidates.stream()
                .filter(value -> normalize(value).contains(normalizedQuery))
                .findFirst()
                .map(this::toSnippet)
                .orElse(post.getExcerpt());
    }

    private String normalize(String value) {
        return value == null ? "" : value.toLowerCase(Locale.ROOT).trim();
    }

    private String toSnippet(String value) {
        String compact = value.replaceAll("\\s+", " ").trim();
        if (compact.length() <= 140) {
            return compact;
        }
        return compact.substring(0, 140).trim() + "...";
    }
}
