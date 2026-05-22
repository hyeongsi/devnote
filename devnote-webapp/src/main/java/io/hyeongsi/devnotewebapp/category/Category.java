package io.hyeongsi.devnotewebapp.category;

import io.hyeongsi.devnotewebapp.post.Post;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "categories")
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 60)
    private String slug;

    @Column(nullable = false, unique = true, length = 60)
    private String name;

    @Column(nullable = false, length = 500)
    private String description;

    @Column(nullable = false)
    private Boolean visible;

    @Column(name = "display_order", nullable = false)
    private Integer displayOrder;

    @OneToMany(mappedBy = "category", fetch = FetchType.LAZY)
    private List<Post> posts = new ArrayList<>();

    protected Category() {
    }

    public Category(String slug, String name, String description, Boolean visible, Integer displayOrder) {
        this.slug = slug;
        this.name = name;
        this.description = description;
        this.visible = visible;
        this.displayOrder = displayOrder;
    }

    public Long getId() {
        return id;
    }

    public String getSlug() {
        return slug;
    }

    public String getName() {
        return name;
    }

    public String getDescription() {
        return description;
    }

    public Boolean getVisible() {
        return visible;
    }

    public Integer getDisplayOrder() {
        return displayOrder;
    }

    public void updateAdminDetails(String slug, String name, String description, Boolean visible, Integer displayOrder) {
        this.slug = slug;
        this.name = name;
        this.description = description;
        this.visible = visible;
        this.displayOrder = displayOrder;
    }
}
