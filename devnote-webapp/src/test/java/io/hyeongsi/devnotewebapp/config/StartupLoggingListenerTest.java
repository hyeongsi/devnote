package io.hyeongsi.devnotewebapp.config;

import io.hyeongsi.devnotewebapp.ai.autopost.AiAutoPostingProperties;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.StandardEnvironment;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@ExtendWith(OutputCaptureExtension.class)
class StartupLoggingListenerTest {

    @Test
    void logsStartupProfileAndAiConfiguration(CapturedOutput output) {
        ConfigurableEnvironment environment = new StandardEnvironment();
        environment.setActiveProfiles("prod");
        AiAutoPostingProperties properties = mock(AiAutoPostingProperties.class);
        when(properties.enabled()).thenReturn(true);
        when(properties.geminiConfigured()).thenReturn(true);

        StartupLoggingListener listener = new StartupLoggingListener(environment, properties);
        listener.onApplicationReady(mock(ApplicationReadyEvent.class));

        assertThat(output).contains("devnote startup completed");
        assertThat(output).contains("profiles=prod");
        assertThat(output).contains("aiAutoPostingEnabled=true");
        assertThat(output).contains("geminiConfigured=true");
    }
}
