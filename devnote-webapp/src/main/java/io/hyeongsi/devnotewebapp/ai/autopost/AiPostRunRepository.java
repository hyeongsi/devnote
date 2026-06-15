package io.hyeongsi.devnotewebapp.ai.autopost;

import org.springframework.data.jpa.repository.JpaRepository;

public interface AiPostRunRepository
        extends JpaRepository<AiPostRun, Long>, AiPostRunRepositoryCustom {
}
