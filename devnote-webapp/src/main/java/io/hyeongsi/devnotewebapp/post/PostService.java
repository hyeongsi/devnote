package io.hyeongsi.devnotewebapp.post;

import io.hyeongsi.devnotewebapp.category.Category;
import io.hyeongsi.devnotewebapp.category.CategoryRepository;
import io.hyeongsi.devnotewebapp.comment.CommentRepository;
import io.hyeongsi.devnotewebapp.like.PostLikeRepository;
import io.hyeongsi.devnotewebapp.view.PostView;
import io.hyeongsi.devnotewebapp.view.PostViewRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.Clock;
import java.time.LocalDateTime;
import java.util.Locale;
import java.util.List;

import static org.springframework.http.HttpStatus.CONFLICT;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
@Transactional(readOnly = true)
public class PostService {

    private final PostRepository postRepository;
    private final CategoryRepository categoryRepository;
    private final CommentRepository commentRepository;
    private final PostLikeRepository postLikeRepository;
    private final PostViewRepository postViewRepository;
    private final PostCreateRequestValidator requestValidator;
    private final PostResponseMapper responseMapper;
    private final Clock clock;

    public PostService(
            PostRepository postRepository,
            CategoryRepository categoryRepository,
            CommentRepository commentRepository,
            PostLikeRepository postLikeRepository,
            PostViewRepository postViewRepository,
            PostCreateRequestValidator requestValidator,
            PostResponseMapper responseMapper,
            Clock clock
    ) {
        this.postRepository = postRepository;
        this.categoryRepository = categoryRepository;
        this.commentRepository = commentRepository;
        this.postLikeRepository = postLikeRepository;
        this.postViewRepository = postViewRepository;
        this.requestValidator = requestValidator;
        this.responseMapper = responseMapper;
        this.clock = clock;
    }

    public List<PostResponse> getPosts() {
        return postRepository.findPostList().stream()
                .map(responseMapper::toSummaryResponse)
                .toList();
    }

    @Transactional
    public PostDetailResponse getPost(String categorySlug, String postSlug) {
        Post post = postRepository.findPostDetail(categorySlug, postSlug)
                .orElseThrow(() -> new ResponseStatusException(
                        NOT_FOUND,
                        "Post not found: " + categorySlug + "/" + postSlug
                ));

        post.incrementViewCount();
        postViewRepository.save(new PostView(post, LocalDateTime.now(clock)));

        return responseMapper.toDetailResponse(post);
    }

    public List<PostSearchResponse> searchPosts(String query) {
        String normalizedQuery = normalize(query);
        if (normalizedQuery.isBlank()) {
            return List.of();
        }

        return postRepository.findPostList().stream()
                .filter(post -> matches(post, normalizedQuery))
                .limit(8)
                .map(post -> responseMapper.toSearchResponse(post, normalizedQuery))
                .toList();
    }

    @Transactional
    public void deletePost(String categorySlug, String postSlug) {
        Post post = postRepository.findPostDetail(categorySlug, postSlug)
                .orElseThrow(() -> new ResponseStatusException(
                        NOT_FOUND,
                        "Post not found: " + categorySlug + "/" + postSlug
                ));

        commentRepository.deleteAllByPost(post);
        postLikeRepository.deleteAllByPost(post);
        postViewRepository.deleteAllByPost(post);
        postRepository.delete(post);
    }

    @Transactional
    public PostDetailResponse createPost(PostCreateRequest request) {
        requestValidator.validate(request);

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
                LocalDate.now(clock),
                request.readTime().trim(),
                0,
                request.thumbnailStyle().trim(),
                request.contentMarkdown().trim(),
                requestValidator.normalizeTags(request.tags())
        );

        return responseMapper.toDetailResponse(postRepository.save(post));
    }

    private boolean matches(Post post, String normalizedQuery) {
        return normalize(post.getTitle()).contains(normalizedQuery)
                || normalize(post.getExcerpt()).contains(normalizedQuery)
                || normalize(post.getContentMarkdown()).contains(normalizedQuery)
                || normalize(post.getCategoryName()).contains(normalizedQuery)
                || normalize(post.getCategorySlug()).contains(normalizedQuery)
                || post.getTags().stream().anyMatch(tag -> normalize(tag).contains(normalizedQuery));
    }

    private String normalize(String value) {
        return value == null ? "" : value.toLowerCase(Locale.ROOT).trim();
    }

}
