package io.hyeongsi.devnotewebapp.ai.autopost;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class AiAutoPostingProperties {

    private final boolean enabled;
    private final String cron;
    private final String zone;
    private final boolean geminiConfigured;
    private final String model;

    public AiAutoPostingProperties(
            @Value("${devnote.ai.auto-posting.enabled:false}") boolean enabled,
            @Value("${devnote.ai.auto-posting.cron:0 0 6 * * *}") String cron,
            @Value("${devnote.ai.auto-posting.zone:Asia/Seoul}") String zone,
            @Value("${devnote.ai.gemini.api-key:}") String apiKey,
            @Value("${devnote.ai.gemini.model:gemini-2.5-flash}") String model
    ) {
        this.enabled = enabled;
        this.cron = cron;
        this.zone = zone;
        this.geminiConfigured = apiKey != null && !apiKey.isBlank();
        this.model = model;
    }

    public boolean enabled() { return enabled; }
    public String cron() { return cron; }
    public String zone() { return zone; }
    public boolean geminiConfigured() { return geminiConfigured; }
    public String model() { return model; }
}
