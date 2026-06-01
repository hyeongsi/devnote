package io.hyeongsi.devnotewebapp.post;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/posts")
public class PostController {

    private final PostService postService;

    public PostController(PostService postService) {
        this.postService = postService;
    }

    @GetMapping
    public List<PostResponse> getPosts() {
        return postService.getPosts();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PostDetailResponse createPost(@RequestBody PostCreateRequest request) {
        return postService.createPost(request);
    }

    @GetMapping("/{categorySlug}/{postSlug}")
    public PostDetailResponse getPost(
            @PathVariable String categorySlug,
            @PathVariable String postSlug
    ) {
        return postService.getPost(categorySlug, postSlug);
    }

    @DeleteMapping("/{categorySlug}/{postSlug}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deletePost(
            @PathVariable String categorySlug,
            @PathVariable String postSlug
    ) {
        postService.deletePost(categorySlug, postSlug);
    }
}
