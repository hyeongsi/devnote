package io.hyeongsi.devnotewebapp.post;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.Table;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "posts")
public class Post {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 120)
    private String slug;

    @Column(nullable = false, length = 60)
    private String categoryName;

    @Column(nullable = false, length = 60)
    private String categorySlug;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, length = 1000)
    private String excerpt;

    @Column(nullable = false)
    private LocalDate publishedAt;

    @Column(nullable = false, length = 30)
    private String readTime;

    @Column(nullable = false)
    private Integer viewCount;

    @Column(nullable = false, length = 30)
    private String thumbnailStyle;

    @Lob
    @Column(nullable = false)
    private String contentMarkdown;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "post_tags", joinColumns = @JoinColumn(name = "post_id"))
    @Column(name = "tag_name", nullable = false, length = 50)
    @OrderColumn(name = "tag_order")
    private List<String> tags = new ArrayList<>();

    protected Post() {
    }

    public Post(
            String slug,
            String categoryName,
            String categorySlug,
            String title,
            String excerpt,
            LocalDate publishedAt,
            String readTime,
            Integer viewCount,
            String thumbnailStyle,
            String contentMarkdown,
            List<String> tags
    ) {
        this.slug = slug;
        this.categoryName = categoryName;
        this.categorySlug = categorySlug;
        this.title = title;
        this.excerpt = excerpt;
        this.publishedAt = publishedAt;
        this.readTime = readTime;
        this.viewCount = viewCount;
        this.thumbnailStyle = thumbnailStyle;
        this.contentMarkdown = contentMarkdown;
        this.tags = new ArrayList<>(tags);
    }

    public Long getId() {
        return id;
    }

    public String getSlug() {
        return slug;
    }

    public String getCategoryName() {
        return categoryName;
    }

    public String getCategorySlug() {
        return categorySlug;
    }

    public String getTitle() {
        return title;
    }

    public String getExcerpt() {
        return excerpt;
    }

    public LocalDate getPublishedAt() {
        return publishedAt;
    }

    public String getReadTime() {
        return readTime;
    }

    public Integer getViewCount() {
        return viewCount;
    }

    public String getThumbnailStyle() {
        return thumbnailStyle;
    }

    public String getContentMarkdown() {
        return contentMarkdown;
    }

    public List<String> getTags() {
        return List.copyOf(tags);
    }
}
