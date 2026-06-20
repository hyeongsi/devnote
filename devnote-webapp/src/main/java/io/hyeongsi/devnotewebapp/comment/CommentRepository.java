package io.hyeongsi.devnotewebapp.comment;

import io.hyeongsi.devnotewebapp.post.Post;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CommentRepository extends JpaRepository<Comment, Long> {

    void deleteAllByPost(Post post);
}
