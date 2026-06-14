package io.hyeongsi.devnotewebapp.ai.autopost;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "ai_post_runs")
public class AiPostRun {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "topic_id")
    private AiPostTopic topic;

    private Long postId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AiPostRunStatus status;

    @Column(length = 200)
    private String generatedTitle;

    @Column(length = 1000)
    private String errorMessage;

    @Column(nullable = false)
    private LocalDateTime startedAt;

    private LocalDateTime completedAt;

    protected AiPostRun() {
    }

    public AiPostRun(AiPostTopic topic, LocalDateTime startedAt) {
        this.topic = topic;
        this.startedAt = startedAt;
        this.status = AiPostRunStatus.RUNNING;
    }

    public static AiPostRun skipped(String reason, LocalDateTime now) {
        AiPostRun run = new AiPostRun(null, now);
        run.status = AiPostRunStatus.SKIPPED;
        run.errorMessage = reason;
        run.completedAt = now;
        return run;
    }

    public void succeed(Long postId, String title, LocalDateTime completedAt) {
        this.status = AiPostRunStatus.SUCCEEDED;
        this.postId = postId;
        this.generatedTitle = title;
        this.completedAt = completedAt;
        this.errorMessage = null;
    }

    public void fail(String message, LocalDateTime completedAt) {
        this.status = AiPostRunStatus.FAILED;
        this.errorMessage = message == null ? "Unknown error" : message.substring(0, Math.min(message.length(), 1000));
        this.completedAt = completedAt;
    }

    public Long getId() { return id; }
    public AiPostTopic getTopic() { return topic; }
    public Long getPostId() { return postId; }
    public AiPostRunStatus getStatus() { return status; }
    public String getGeneratedTitle() { return generatedTitle; }
    public String getErrorMessage() { return errorMessage; }
    public LocalDateTime getStartedAt() { return startedAt; }
    public LocalDateTime getCompletedAt() { return completedAt; }
}
