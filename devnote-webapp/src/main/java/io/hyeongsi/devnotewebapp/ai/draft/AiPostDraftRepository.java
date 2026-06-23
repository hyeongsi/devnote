package io.hyeongsi.devnotewebapp.ai.draft;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AiPostDraftRepository extends JpaRepository<AiPostDraft, Long> {
    List<AiPostDraft> findAllByOrderByCreatedAtDescIdDesc(Pageable pageable);
}
