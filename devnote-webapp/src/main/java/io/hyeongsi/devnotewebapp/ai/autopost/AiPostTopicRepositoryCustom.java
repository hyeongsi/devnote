package io.hyeongsi.devnotewebapp.ai.autopost;

import java.util.List;
import java.util.Optional;

public interface AiPostTopicRepositoryCustom {

    Optional<AiPostTopic> findNextEnabledTopic();

    List<AiPostTopic> findAllOrdered();
}
