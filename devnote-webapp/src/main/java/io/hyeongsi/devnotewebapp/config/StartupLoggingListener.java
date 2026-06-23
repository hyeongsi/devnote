package io.hyeongsi.devnotewebapp.config;

import io.hyeongsi.devnotewebapp.ai.autopost.AiAutoPostingProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

@Component
public class StartupLoggingListener {

    private static final Logger log = LoggerFactory.getLogger(StartupLoggingListener.class);

    private final Environment environment;
    private final AiAutoPostingProperties properties;

    public StartupLoggingListener(Environment environment, AiAutoPostingProperties properties) {
        this.environment = environment;
        this.properties = properties;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void onApplicationReady(ApplicationReadyEvent event) {
        String profiles = String.join(",", environment.getActiveProfiles());
        if (profiles.isBlank()) {
            profiles = String.join(",", environment.getDefaultProfiles());
        }
        log.info(
                "devnote startup completed profiles={} aiAutoPostingEnabled={} geminiConfigured={}",
                profiles,
                properties.enabled(),
                properties.geminiConfigured()
        );
    }
}
