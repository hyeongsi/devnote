package io.hyeongsi.devnotewebapp;

import io.hyeongsi.devnotewebapp.post.PostRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class DevnoteWebappApplicationTests {

    @Autowired
    private PostRepository postRepository;

    @Test
    void contextLoads() {
    }

    @Test
    void loadsKoreanPostDataAsUtf8() {
        assertThat(postRepository.findById(1L))
                .hasValueSatisfying(post -> {
                    assertThat(post.getTitle()).isEqualTo("Spring Boot 3.x 예외 처리 정리");
                    assertThat(post.getExcerpt())
                            .isEqualTo("@ControllerAdvice를 이용한 공통 예외 처리와 응답 설계 방법을 정리했습니다.");
                    assertThat(post.getReadTime()).isEqualTo("5분 읽기");
                });
    }
}
