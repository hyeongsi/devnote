package io.hyeongsi.devnotewebapp.comment;

import io.hyeongsi.devnotewebapp.post.Post;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CommentRepository extends JpaRepository<Comment, Long> {

    List<Comment> findTop5ByOrderByCreatedAtDesc();

    void deleteAllByPost(Post post);
}
