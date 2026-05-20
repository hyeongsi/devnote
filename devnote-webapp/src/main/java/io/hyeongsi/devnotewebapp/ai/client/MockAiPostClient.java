package io.hyeongsi.devnotewebapp.ai.client;

import io.hyeongsi.devnotewebapp.ai.dto.AiPostGenerateResponse;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Locale;

@Service
public class MockAiPostClient implements AiPostClient {

    @Override
    public AiPostGenerateResponse generate(String topic) {
        String normalizedTopic = topic.trim();
        String categorySlug = recommendCategorySlug(normalizedTopic);

        return new AiPostGenerateResponse(
                normalizedTopic + "를 실무 관점에서 이해하기",
                normalizedTopic + "의 핵심 개념, 실무 활용 방식, 주의사항을 학습형 블로그 글로 정리합니다.",
                buildContent(normalizedTopic),
                buildTags(normalizedTopic, categorySlug),
                "8분 읽기",
                buildRecommendedTopics(normalizedTopic, categorySlug),
                categorySlug,
                recommendThumbnailStyle(categorySlug)
        );
    }

    private String recommendCategorySlug(String topic) {
        String lowerTopic = topic.toLowerCase(Locale.ROOT);

        if (lowerTopic.contains("spring") || lowerTopic.contains("security") || lowerTopic.contains("jpa")) {
            return "spring-boot";
        }
        if (lowerTopic.contains("java") || lowerTopic.contains("jvm") || topic.contains("객체지향") || lowerTopic.contains("stream")) {
            return "java";
        }
        if (lowerTopic.contains("ai") || lowerTopic.contains("gpt") || lowerTopic.contains("codex") || topic.contains("자동화")) {
            return "ai-automation";
        }
        if (lowerTopic.contains("docker") || lowerTopic.contains("ci/cd") || topic.contains("배포") || lowerTopic.contains("github actions")) {
            return "devops";
        }
        if (lowerTopic.contains("sql") || lowerTopic.contains("database") || lowerTopic.contains("index")
                || lowerTopic.contains("mysql") || lowerTopic.contains("postgresql")) {
            return "database";
        }
        if (topic.contains("서버") || topic.contains("모니터링") || lowerTopic.contains("infra") || lowerTopic.contains("nginx")) {
            return "infra";
        }

        return "etc";
    }

    private List<String> buildTags(String topic, String categorySlug) {
        return switch (categorySlug) {
            case "spring-boot" -> List.of(topic, "Spring Boot", "Backend", "실무");
            case "java" -> List.of(topic, "Java", "JVM", "Backend");
            case "ai-automation" -> List.of(topic, "AI", "Automation", "GPT");
            case "devops" -> List.of(topic, "DevOps", "CI/CD", "운영");
            case "database" -> List.of(topic, "Database", "SQL", "Performance");
            case "infra" -> List.of(topic, "Infra", "Monitoring", "운영");
            default -> List.of(topic, "개발", "학습", "실무");
        };
    }

    private List<String> buildRecommendedTopics(String topic, String categorySlug) {
        return switch (categorySlug) {
            case "spring-boot" -> List.of("Spring Security Filter Chain", "JWT 인증 방식", "OAuth2 로그인", "CORS와 CSRF 차이");
            case "java" -> List.of("JVM 메모리 구조", "객체지향 설계 원칙", "Java Stream API", "예외 처리 전략");
            case "ai-automation" -> List.of("프롬프트 엔지니어링", "RAG 구조", "AI 워크플로 자동화", "API Key 보안 관리");
            case "devops" -> List.of("Docker Compose", "GitHub Actions", "무중단 배포", "배포 파이프라인 설계");
            case "database" -> List.of("인덱스 설계", "실행 계획 분석", "트랜잭션 격리 수준", "N+1 문제 해결");
            case "infra" -> List.of("Nginx 리버스 프록시", "서버 모니터링", "로그 수집", "장애 대응 체크리스트");
            default -> List.of(topic + " 심화 학습", "관련 실무 사례", "운영 시 주의사항", "학습 로드맵 구성");
        };
    }

    private String recommendThumbnailStyle(String categorySlug) {
        return switch (categorySlug) {
            case "ai-automation" -> "ai";
            case "devops" -> "docker";
            case "database" -> "data";
            case "infra" -> "monitor";
            case "java" -> "code";
            default -> "laptop";
        };
    }

    private String buildContent(String topic) {
        return """
                ## %s란?

                %s는 개발자가 특정 문제를 더 안정적이고 반복 가능한 방식으로 해결하기 위해 이해해야 하는 중요한 주제입니다. 단순히 기능 이름을 아는 것보다 어떤 상황에서 필요하고, 어떤 개념들이 함께 움직이는지 파악하는 것이 실무 적용의 출발점입니다.

                ## 왜 알아야 할까?

                실무에서는 기능을 빠르게 붙이는 것만큼 유지보수 가능한 구조를 만드는 일이 중요합니다. %s를 이해하면 문제의 원인을 더 빠르게 추적하고, 팀 안에서 같은 기준으로 설계와 리뷰를 진행할 수 있습니다.

                ## 핵심 개념

                핵심은 입력, 처리 흐름, 결과를 분리해서 바라보는 것입니다. 어떤 요청이나 데이터가 들어오고, 중간 단계에서 어떤 검증과 변환을 거치며, 최종적으로 어떤 결과를 만들어야 하는지 순서대로 정리하면 전체 구조가 선명해집니다.

                ## 부수 개념

                부수적으로는 설정 방식, 예외 처리, 성능 영향, 보안 조건을 함께 봐야 합니다. 특히 기본 설정이 제공되는 기술일수록 내부 동작을 모른 채 복사해서 쓰면 예상하지 못한 문제가 생기기 쉽습니다.

                ## 필수 숙지 개념

                - 기본 용어와 책임 범위
                - 요청이 처리되는 전체 흐름
                - 실패 상황에서의 예외 처리 방식
                - 운영 환경에서 확인해야 할 설정값
                - 테스트로 검증해야 하는 주요 시나리오

                ## 실무 활용 방식

                %s는 신규 기능을 설계할 때뿐 아니라 기존 코드의 문제를 분석할 때도 유용합니다. 예를 들어 기능 요구사항을 API, 서비스, 저장소 계층으로 나누고 각 계층의 책임을 분명히 하면 변경 범위가 작아집니다.

                ## 간단한 사용 방법

                1. 해결하려는 문제와 입력값을 먼저 정의합니다.
                2. 필요한 핵심 개념을 작은 단위로 나눕니다.
                3. 가장 단순한 동작부터 구현하고 테스트합니다.
                4. 예외 상황과 운영 조건을 추가로 점검합니다.

                ## 코드 예시 또는 구조 예시

                ```java
                @Service
                public class ExampleLearningService {
                    public String summarize(String topic) {
                        if (topic == null || topic.isBlank()) {
                            throw new IllegalArgumentException("topic is required");
                        }

                        return topic.trim() + " 학습 내용을 정리합니다.";
                    }
                }
                ```

                ## 추가 활용 방안

                학습한 내용을 문서화하거나 체크리스트로 만들면 다음 프로젝트에서도 재사용할 수 있습니다. 또한 팀 코드 리뷰 기준, 장애 대응 가이드, 온보딩 문서로 확장하기 좋습니다.

                ## 주의사항

                예제 코드만 보고 바로 운영 코드에 반영하면 맥락이 맞지 않을 수 있습니다. 현재 프로젝트의 인증 방식, 데이터 모델, 배포 환경, 트래픽 규모에 맞는지 반드시 확인해야 합니다.

                ## 추가로 알면 좋은 항목

                - 관련 프레임워크의 기본 동작 방식
                - 테스트 전략과 실패 케이스 설계
                - 로그와 모니터링 포인트
                - 운영 환경에서 자주 발생하는 장애 사례

                ## 요약 정리

                %s를 잘 이해한다는 것은 개념을 암기하는 것이 아니라 실제 문제에 맞게 적용할 수 있다는 뜻입니다. 핵심 흐름, 부수 개념, 주의사항을 함께 정리하면 더 안정적인 개발 판단을 할 수 있습니다.
                """.formatted(topic, topic, topic, topic, topic);
    }
}
