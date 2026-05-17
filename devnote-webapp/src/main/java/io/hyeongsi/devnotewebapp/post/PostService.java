package io.hyeongsi.devnotewebapp.post;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.format.DateTimeFormatter;
import java.util.List;

import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
@Transactional(readOnly = true)
public class PostService {

    private static final DateTimeFormatter DISPLAY_DATE_FORMAT = DateTimeFormatter.ofPattern("yyyy.MM.dd");

    private final PostRepository postRepository;

    public PostService(PostRepository postRepository) {
        this.postRepository = postRepository;
    }

    public List<PostResponse> getPosts() {
        return postRepository.findPostList().stream()
                .map(this::toSummaryResponse)
                .toList();
    }

    public PostDetailResponse getPost(String categorySlug, String postSlug) {
        Post post = postRepository.findPostDetail(categorySlug, postSlug)
                .orElseThrow(() -> new ResponseStatusException(
                        NOT_FOUND,
                        "Post not found: " + categorySlug + "/" + postSlug
                ));

        return toDetailResponse(post);
    }

    private PostResponse toSummaryResponse(Post post) {
        return new PostResponse(
                post.getId(),
                post.getSlug(),
                post.getCategoryName(),
                post.getCategorySlug(),
                post.getTitle(),
                post.getExcerpt(),
                post.getPublishedAt().format(DISPLAY_DATE_FORMAT),
                post.getReadTime(),
                post.getViewCount(),
                post.getTags(),
                post.getThumbnailStyle()
        );
    }

    private PostDetailResponse toDetailResponse(Post post) {
        return new PostDetailResponse(
                post.getId(),
                post.getSlug(),
                post.getCategoryName(),
                post.getCategorySlug(),
                post.getTitle(),
                post.getExcerpt(),
                post.getPublishedAt().format(DISPLAY_DATE_FORMAT),
                post.getReadTime(),
                post.getViewCount(),
                post.getTags(),
                post.getThumbnailStyle(),
                post.getContentMarkdown()
        );
    }
}
