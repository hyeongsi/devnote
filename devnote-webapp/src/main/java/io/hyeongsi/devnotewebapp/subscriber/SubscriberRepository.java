package io.hyeongsi.devnotewebapp.subscriber;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;

public interface SubscriberRepository extends JpaRepository<Subscriber, Long> {

    long countBySubscribedAtGreaterThanEqual(LocalDateTime subscribedAt);
}
