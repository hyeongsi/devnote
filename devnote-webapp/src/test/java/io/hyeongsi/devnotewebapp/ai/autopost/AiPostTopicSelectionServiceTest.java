package io.hyeongsi.devnotewebapp.ai.autopost;

import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class AiPostTopicSelectionServiceTest {

    private final AiPostTopicSelectionService service = new AiPostTopicSelectionService();

    @Test
    void selectsNeverUsedTopicBeforePreviouslyUsedTopics() {
        AiPostTopic used = topic("Java", 1, LocalDateTime.of(2026, 6, 10, 6, 0));
        AiPostTopic unused = topic("Spring Boot", 2, null);

        assertThat(service.selectNext(List.of(used, unused))).contains(unused);
    }

    @Test
    void selectsOldestSuccessThenDisplayOrder() {
        LocalDateTime oldest = LocalDateTime.of(2026, 6, 10, 6, 0);
        AiPostTopic second = topic("Database", 2, oldest);
        AiPostTopic first = topic("DevOps", 1, oldest);

        assertThat(service.selectNext(List.of(second, first))).contains(first);
    }

    private AiPostTopic topic(String name, int order, LocalDateTime lastSucceededAt) {
        return new AiPostTopic(name, null, order, true, lastSucceededAt);
    }
}
