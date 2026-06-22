package io.hyeongsi.devnotewebapp.ai.autopost;

import io.hyeongsi.devnotewebapp.ai.draft.AiPostDraftDtos;
import io.hyeongsi.devnotewebapp.post.PostDetailResponse;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/ai-posting")
public class AiAutoPostingController {

    private final AiAutoPostingAdminService service;

    public AiAutoPostingController(AiAutoPostingAdminService service) {
        this.service = service;
    }

    @GetMapping("/status")
    public AiAutoPostingDtos.StatusResponse status() { return service.status(); }

    @GetMapping("/topics")
    public List<AiAutoPostingDtos.TopicResponse> topics() { return service.topics(); }

    @PostMapping("/topics")
    public AiAutoPostingDtos.TopicResponse create(@RequestBody AiAutoPostingDtos.TopicRequest request) {
        return service.create(request);
    }

    @PutMapping("/topics/{id}")
    public AiAutoPostingDtos.TopicResponse update(
            @PathVariable Long id,
            @RequestBody AiAutoPostingDtos.TopicRequest request
    ) {
        return service.update(id, request);
    }

    @DeleteMapping("/topics/{id}")
    public void disable(@PathVariable Long id) { service.disable(id); }

    @PutMapping("/topics/order")
    public void reorder(@RequestBody AiAutoPostingDtos.OrderRequest request) { service.reorder(request); }

    @GetMapping("/runs")
    public List<AiPostDraftDtos.HistoryItem> runs() { return service.runs(); }

    @GetMapping("/drafts/{id}")
    public AiPostDraftDtos.DraftDetail draft(@PathVariable Long id) {
        return service.draft(id);
    }

    @PostMapping("/drafts/{id}/publish")
    @ResponseStatus(HttpStatus.CREATED)
    public PostDetailResponse publishDraft(
            @PathVariable Long id,
            @RequestBody AiPostDraftDtos.PublishDraftRequest request
    ) {
        return service.publishDraft(id, request);
    }

    @PostMapping("/run")
    public AiAutoPostingDtos.RunResponse runNow() { return service.runNow(); }
}
