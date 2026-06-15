package io.hyeongsi.devnotewebapp.view;

import io.hyeongsi.devnotewebapp.post.Post;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PostViewRepository extends JpaRepository<PostView, Long> {

    void deleteAllByPost(Post post);
}
