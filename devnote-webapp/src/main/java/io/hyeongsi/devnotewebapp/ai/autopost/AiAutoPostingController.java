package io.hyeongsi.devnotewebapp.ai.autopost;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
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
    public List<AiAutoPostingDtos.RunResponse> runs() { return service.runs(); }

    @PostMapping("/run")
    public AiAutoPostingDtos.RunResponse runNow() { return service.runNow(); }
}
