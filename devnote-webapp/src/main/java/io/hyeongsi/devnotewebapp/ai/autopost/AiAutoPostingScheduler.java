package io.hyeongsi.devnotewebapp.ai.autopost;

import org.springframework.scheduling.annotation.Scheduled;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class AiAutoPostingScheduler {

    private static final Logger log = LoggerFactory.getLogger(AiAutoPostingScheduler.class);

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
        log.info(
                "ai-autopost scheduled trigger enabled={} geminiConfigured={}",
                properties.enabled(),
                properties.geminiConfigured()
        );
        if (properties.enabled() && properties.geminiConfigured()) {
            service.executeScheduled();
            return;
        }
        log.warn(
                "ai-autopost scheduled skipped enabled={} geminiConfigured={}",
                properties.enabled(),
                properties.geminiConfigured()
        );
    }
}
