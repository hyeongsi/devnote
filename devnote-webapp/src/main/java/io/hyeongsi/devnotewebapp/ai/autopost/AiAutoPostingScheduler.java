package io.hyeongsi.devnotewebapp.ai.autopost;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class AiAutoPostingScheduler {

    private final AiAutoPostingService service;
    private final AiAutoPostingProperties properties;

    public AiAutoPostingScheduler(AiAutoPostingService service, AiAutoPostingProperties properties) {
        this.service = service;
        this.properties = properties;
    }

    @Scheduled(
            cron = "${devnote.ai.auto-posting.cron:0 0 6 * * *}",
            zone = "${devnote.ai.auto-posting.zone:Asia/Seoul}"
    )
    public void publishDailyPost() {
        if (properties.enabled() && properties.geminiConfigured()) {
            service.executeScheduled();
        }
    }
}
