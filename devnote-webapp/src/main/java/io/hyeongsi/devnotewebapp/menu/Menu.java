package io.hyeongsi.devnotewebapp.menu;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "menus")
public class Menu {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 60)
    private String name;

    @Column(nullable = false, unique = true, length = 120)
    private String path;

    @Column(nullable = false, length = 60)
    private String state;

    @Column(nullable = false)
    private Boolean visible;

    @Column(name = "display_order", nullable = false)
    private Integer displayOrder;

    protected Menu() {
    }

    public Menu(String name, String path, String state, Boolean visible, Integer displayOrder) {
        this.name = name;
        this.path = path;
        this.state = state;
        this.visible = visible;
        this.displayOrder = displayOrder;
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getPath() {
        return path;
    }

    public String getState() {
        return state;
    }

    public Boolean getVisible() {
        return visible;
    }

    public Integer getDisplayOrder() {
        return displayOrder;
    }

    public void updateAdminDetails(String name, String path, String state, Boolean visible, Integer displayOrder) {
        this.name = name;
        this.path = path;
        this.state = state;
        this.visible = visible;
        this.displayOrder = displayOrder;
    }
}
