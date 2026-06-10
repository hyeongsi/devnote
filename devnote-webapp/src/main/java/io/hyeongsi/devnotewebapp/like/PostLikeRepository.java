package io.hyeongsi.devnotewebapp.like;

import io.hyeongsi.devnotewebapp.post.Post;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PostLikeRepository extends JpaRepository<PostLike, Long> {

    List<PostLike> findTop5ByOrderByCreatedAtDesc();

    void deleteAllByPost(Post post);
}
