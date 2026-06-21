package io.hyeongsi.devnotewebapp.ai.client;

import java.util.List;

record GeminiPostReview(boolean passed, List<Issue> issues) {
    record Issue(String sectionKey, String type, String severity, String instruction) {
    }
}
