package io.hyeongsi.devnotewebapp.menu;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/menus")
public class MenuController {

    private final MenuService menuService;

    public MenuController(MenuService menuService) {
        this.menuService = menuService;
    }

    @GetMapping
    public List<AdminMenuResponse> getPublicMenus() {
        return menuService.getPublicMenus();
    }

    @GetMapping("/admin")
    public List<AdminMenuResponse> getAdminMenus() {
        return menuService.getAdminMenus();
    }

    @GetMapping("/admin/sidebar")
    public List<AdminMenuResponse> getAdminSidebarMenus() {
        return menuService.getAdminSidebarMenus();
    }

    @PutMapping("/admin")
    public void saveAdminMenus(@RequestBody List<AdminMenuSaveRequest> requests) {
        menuService.saveAdminMenus(requests);
    }
}
