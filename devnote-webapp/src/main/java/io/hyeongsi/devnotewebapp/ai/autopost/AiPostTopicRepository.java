package io.hyeongsi.devnotewebapp.ai.autopost;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AiPostTopicRepository extends JpaRepository<AiPostTopic, Long> {
    List<AiPostTopic> findAllByEnabledTrueOrderByDisplayOrderAscIdAsc();
}
