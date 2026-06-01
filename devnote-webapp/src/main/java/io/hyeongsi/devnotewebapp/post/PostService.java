package io.hyeongsi.devnotewebapp.post;

import io.hyeongsi.devnotewebapp.category.Category;
import io.hyeongsi.devnotewebapp.category.CategoryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.CONFLICT;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
@Transactional(readOnly = true)
public class PostService {

    private static final DateTimeFormatter DISPLAY_DATE_FORMAT = DateTimeFormatter.ofPattern("yyyy.MM.dd");

    private final PostRepository postRepository;
    private final CategoryRepository categoryRepository;

    public PostService(PostRepository postRepository, CategoryRepository categoryRepository) {
        this.postRepository = postRepository;
        this.categoryRepository = categoryRepository;
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

    @Transactional
    public void deletePost(String categorySlug, String postSlug) {
        Post post = postRepository.findPostDetail(categorySlug, postSlug)
                .orElseThrow(() -> new ResponseStatusException(
                        NOT_FOUND,
                        "Post not found: " + categorySlug + "/" + postSlug
                ));

        postRepository.delete(post);
    }

    @Transactional
    public PostDetailResponse createPost(PostCreateRequest request) {
        validateCreateRequest(request);

        if (postRepository.existsBySlug(request.slug())) {
            throw new ResponseStatusException(CONFLICT, "Post slug already exists: " + request.slug());
        }

        Category category = categoryRepository.findById(request.categoryId())
                .orElseThrow(() -> new ResponseStatusException(
                        NOT_FOUND,
                        "Category not found: " + request.categoryId()
                ));

        Post post = new Post(
                request.slug().trim(),
                category,
                request.title().trim(),
                request.excerpt().trim(),
                LocalDate.now(),
                request.readTime().trim(),
                0,
                request.thumbnailStyle().trim(),
                request.contentMarkdown().trim(),
                request.tags().stream()
                        .map(String::trim)
                        .filter(tag -> !tag.isBlank())
                        .limit(10)
                        .toList()
        );

        return toDetailResponse(postRepository.save(post));
    }

    private void validateCreateRequest(PostCreateRequest request) {
        if (request == null) {
            throw new ResponseStatusException(BAD_REQUEST, "Post request is required");
        }
        if (isBlank(request.slug())) {
            throw new ResponseStatusException(BAD_REQUEST, "Post slug is required");
        }
        if (request.categoryId() == null) {
            throw new ResponseStatusException(BAD_REQUEST, "Category id is required");
        }
        if (isBlank(request.title())) {
            throw new ResponseStatusException(BAD_REQUEST, "Post title is required");
        }
        if (isBlank(request.excerpt())) {
            throw new ResponseStatusException(BAD_REQUEST, "Post excerpt is required");
        }
        if (isBlank(request.readTime())) {
            throw new ResponseStatusException(BAD_REQUEST, "Read time is required");
        }
        if (isBlank(request.thumbnailStyle())) {
            throw new ResponseStatusException(BAD_REQUEST, "Thumbnail style is required");
        }
        if (isBlank(request.contentMarkdown())) {
            throw new ResponseStatusException(BAD_REQUEST, "Content markdown is required");
        }
        if (request.tags() == null || request.tags().stream().map(String::trim).filter(tag -> !tag.isBlank()).toList().isEmpty()) {
            throw new ResponseStatusException(BAD_REQUEST, "At least one tag is required");
        }
        if (request.tags().size() > 10) {
            throw new ResponseStatusException(BAD_REQUEST, "Tags cannot exceed 10 items");
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
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
