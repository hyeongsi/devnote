package io.hyeongsi.devnotewebapp.post;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface PostRepository extends JpaRepository<Post, Long>, PostRepositoryCustom {

    boolean existsBySlug(String slug);

    @Query("select coalesce(sum(post.viewCount), 0) from Post post")
    long sumViewCount();

    List<Post> findTop5ByOrderByPublishedAtDescIdDesc();
}
