package io.hyeongsi.devnotewebapp.ai.draft;

import io.hyeongsi.devnotewebapp.ai.dto.AiPostGenerateResponse;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.Table;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "ai_post_drafts")
public class AiPostDraft {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 300)
    private String topic;

    @Column(nullable = false, length = 300)
    private String title;

    @Column(nullable = false, length = 2000)
    private String summary;

    @Lob
    @Column(nullable = false)
    private String content;

    @Column(nullable = false, length = 100)
    private String readTime;

    @Column(nullable = false, length = 50)
    private String thumbnailStyle;

    @Column(length = 100)
    private String recommendedCategorySlug;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "ai_post_draft_tags", joinColumns = @JoinColumn(name = "draft_id"))
    @OrderColumn(name = "tag_order")
    @Column(name = "tag", nullable = false, length = 100)
    private List<String> tags = new ArrayList<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "ai_post_draft_recommended_topics", joinColumns = @JoinColumn(name = "draft_id"))
    @OrderColumn(name = "topic_order")
    @Column(name = "recommended_topic", nullable = false, length = 300)
    private List<String> recommendedTopics = new ArrayList<>();

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AiPostDraftStatus status;

    private Long postId;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    private LocalDateTime publishedAt;

    protected AiPostDraft() {
    }

    public AiPostDraft(String topic, AiPostGenerateResponse result, LocalDateTime createdAt) {
        this.topic = topic;
        this.title = result.title();
        this.summary = result.summary();
        this.content = result.content();
        this.readTime = result.readTime();
        this.thumbnailStyle = result.thumbnailStyle();
        this.recommendedCategorySlug = result.recommendedCategorySlug();
        this.tags = new ArrayList<>(result.tags());
        this.recommendedTopics = new ArrayList<>(result.recommendedTopics());
        this.status = AiPostDraftStatus.DRAFT;
        this.createdAt = createdAt;
    }

    public void publish(Long postId, LocalDateTime publishedAt) {
        if (status != AiPostDraftStatus.DRAFT) {
            throw new IllegalStateException("AI post draft is already published");
        }
        this.status = AiPostDraftStatus.PUBLISHED;
        this.postId = postId;
        this.publishedAt = publishedAt;
    }

    public Long getId() { return id; }
    public String getTopic() { return topic; }
    public String getTitle() { return title; }
    public String getSummary() { return summary; }
    public String getContent() { return content; }
    public String getReadTime() { return readTime; }
    public String getThumbnailStyle() { return thumbnailStyle; }
    public String getRecommendedCategorySlug() { return recommendedCategorySlug; }
    public List<String> getTags() { return List.copyOf(tags); }
    public List<String> getRecommendedTopics() { return List.copyOf(recommendedTopics); }
    public AiPostDraftStatus getStatus() { return status; }
    public Long getPostId() { return postId; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getPublishedAt() { return publishedAt; }
}
