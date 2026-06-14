package io.hyeongsi.devnotewebapp.ai.autopost;

import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@Component
public class AiPostTopicSelectionService {

    public Optional<AiPostTopic> selectNext(List<AiPostTopic> topics) {
        return topics.stream()
                .filter(topic -> Boolean.TRUE.equals(topic.getEnabled()))
                .min(Comparator
                        .comparing(AiPostTopic::getLastSucceededAt, Comparator.nullsFirst(LocalDateTime::compareTo))
                        .thenComparing(AiPostTopic::getDisplayOrder)
                        .thenComparing(topic -> topic.getId() == null ? Long.MAX_VALUE : topic.getId()));
    }
}
