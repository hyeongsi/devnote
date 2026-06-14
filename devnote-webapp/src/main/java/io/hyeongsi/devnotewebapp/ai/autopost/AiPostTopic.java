package io.hyeongsi.devnotewebapp.ai.autopost;

import io.hyeongsi.devnotewebapp.category.Category;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "ai_post_topics")
public class AiPostTopic {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 120)
    private String name;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @Column(name = "display_order", nullable = false)
    private Integer displayOrder;

    @Column(nullable = false)
    private Boolean enabled;

    private LocalDateTime lastSucceededAt;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    protected AiPostTopic() {
    }

    public AiPostTopic(String name, Category category, Integer displayOrder, Boolean enabled) {
        this(name, category, displayOrder, enabled, null);
    }

    AiPostTopic(String name, Category category, Integer displayOrder, Boolean enabled, LocalDateTime lastSucceededAt) {
        this.name = name;
        this.category = category;
        this.displayOrder = displayOrder;
        this.enabled = enabled;
        this.lastSucceededAt = lastSucceededAt;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = this.createdAt;
    }

    public void update(String name, Category category, Integer displayOrder, Boolean enabled) {
        this.name = name;
        this.category = category;
        this.displayOrder = displayOrder;
        this.enabled = enabled;
        this.updatedAt = LocalDateTime.now();
    }

    public void markSucceeded(LocalDateTime completedAt) {
        this.lastSucceededAt = completedAt;
        this.updatedAt = completedAt;
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public Category getCategory() { return category; }
    public Integer getDisplayOrder() { return displayOrder; }
    public Boolean getEnabled() { return enabled; }
    public LocalDateTime getLastSucceededAt() { return lastSucceededAt; }
}
