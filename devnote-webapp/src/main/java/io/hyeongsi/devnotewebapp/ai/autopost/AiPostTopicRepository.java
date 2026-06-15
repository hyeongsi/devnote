package io.hyeongsi.devnotewebapp.ai.autopost;

import org.springframework.data.jpa.repository.JpaRepository;

public interface AiPostTopicRepository
        extends JpaRepository<AiPostTopic, Long>, AiPostTopicRepositoryCustom {
}
