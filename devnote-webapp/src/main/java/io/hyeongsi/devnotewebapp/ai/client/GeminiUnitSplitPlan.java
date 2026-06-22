package io.hyeongsi.devnotewebapp.ai.client;

import java.util.List;

record GeminiUnitSplitPlan(List<Unit> units) {
    record Unit(String key, String heading, String brief) {
    }
}
