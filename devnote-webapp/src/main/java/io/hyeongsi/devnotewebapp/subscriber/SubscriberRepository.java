package io.hyeongsi.devnotewebapp.subscriber;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface SubscriberRepository extends JpaRepository<Subscriber, Long> {

    long countBySubscribedAtGreaterThanEqual(LocalDateTime subscribedAt);

    List<Subscriber> findTop5ByOrderBySubscribedAtDesc();
}
