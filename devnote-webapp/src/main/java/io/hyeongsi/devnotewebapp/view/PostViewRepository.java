package io.hyeongsi.devnotewebapp.view;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface PostViewRepository extends JpaRepository<PostView, Long> {

    List<PostView> findAllByViewedAtGreaterThanEqualAndViewedAtLessThan(
            LocalDateTime start,
            LocalDateTime end
    );
}
