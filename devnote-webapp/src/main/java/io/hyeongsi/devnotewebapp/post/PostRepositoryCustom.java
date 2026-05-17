package io.hyeongsi.devnotewebapp.post;

import java.util.List;
import java.util.Optional;

public interface PostRepositoryCustom {

    List<Post> findPostList();

    Optional<Post> findPostDetail(String categorySlug, String postSlug);
}
