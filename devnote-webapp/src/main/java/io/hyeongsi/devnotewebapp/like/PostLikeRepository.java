package io.hyeongsi.devnotewebapp.like;

import io.hyeongsi.devnotewebapp.post.Post;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PostLikeRepository extends JpaRepository<PostLike, Long> {

    void deleteAllByPost(Post post);
}
