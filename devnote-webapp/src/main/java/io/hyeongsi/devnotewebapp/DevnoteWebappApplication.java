package io.hyeongsi.devnotewebapp;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class DevnoteWebappApplication {

    public static void main(String[] args) {
        SpringApplication.run(DevnoteWebappApplication.class, args);
    }

}
