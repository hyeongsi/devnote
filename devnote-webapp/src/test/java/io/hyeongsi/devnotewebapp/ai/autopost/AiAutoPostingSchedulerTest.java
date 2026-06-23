package io.hyeongsi.devnotewebapp.ai.autopost;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(OutputCaptureExtension.class)
class AiAutoPostingSchedulerTest {

    @Test
    void logsSchedulerTriggerAndSkipWhenDisabled(CapturedOutput output) {
        AiAutoPostingService service = mock(AiAutoPostingService.class);
        AiAutoPostingProperties properties = mock(AiAutoPostingProperties.class);
        when(properties.enabled()).thenReturn(false);
        when(properties.geminiConfigured()).thenReturn(true);

        new AiAutoPostingScheduler(service, properties).publishDailyPost();

        assertThat(output).contains("ai-autopost scheduled trigger");
        assertThat(output).contains("enabled=false");
        assertThat(output).contains("geminiConfigured=true");
        assertThat(output).contains("ai-autopost scheduled skipped");
        verify(service, never()).executeScheduled();
    }

    @Test
    void logsSchedulerTriggerAndExecutesWhenConfigured(CapturedOutput output) {
        AiAutoPostingService service = mock(AiAutoPostingService.class);
        AiAutoPostingProperties properties = mock(AiAutoPostingProperties.class);
        when(properties.enabled()).thenReturn(true);
        when(properties.geminiConfigured()).thenReturn(true);

        new AiAutoPostingScheduler(service, properties).publishDailyPost();

        assertThat(output).contains("ai-autopost scheduled trigger");
        assertThat(output).contains("enabled=true");
        assertThat(output).contains("geminiConfigured=true");
        verify(service).executeScheduled();
    }
}
