package io.hyeongsi.devnotewebapp.menu;

import org.junit.jupiter.api.Test;

import java.lang.reflect.Field;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class MenuServiceTest {

    @Test
    void getPublicMenusReturnsOnlyVisibleHeaderMenusInDisplayOrder() {
        MenuRepository menuRepository = mock(MenuRepository.class);
        MenuService menuService = new MenuService(menuRepository);

        when(menuRepository.findAll()).thenReturn(List.of(
                menu(1L, "ROOT", "/__root", "ROOT", null, false, 0),
                menu(2L, "Admin Menu", "/__admin-menu", "ADMIN", 1L, false, 1),
                menu(3L, "Header Menu", "/__header-menu", "HEADER", 1L, false, 2),
                menu(4L, "Admin", "/admin", "ADMIN", 2L, true, 1),
                menu(5L, "Hidden", "/hidden", "HEADER", 3L, false, 1),
                menu(6L, "Blog", "/posts", "HEADER", 3L, true, 3),
                menu(7L, "Home", "/", "HEADER", 3L, true, 2)
        ));

        List<AdminMenuResponse> menus = menuService.getPublicMenus();

        assertThat(menus)
                .extracting(AdminMenuResponse::name)
                .containsExactly("Home", "Blog");
        assertThat(menus)
                .extracting(AdminMenuResponse::path)
                .containsExactly("/", "/posts");
    }

    @Test
    void getAdminSidebarMenusReturnsOnlyVisibleAdminChildren() {
        MenuRepository menuRepository = mock(MenuRepository.class);
        MenuService menuService = new MenuService(menuRepository);

        when(menuRepository.findAll()).thenReturn(List.of(
                menu(1L, "ROOT", "/__root", "ROOT", null, false, 0),
                menu(2L, "Admin Menu", "/__admin-menu", "ADMIN", 1L, false, 1),
                menu(3L, "Header Menu", "/__header-menu", "HEADER", 1L, false, 2),
                menu(4L, "Posts", "/posts", "ADMIN", 2L, true, 2),
                menu(5L, "Dashboard", "/admin", "ADMIN", 2L, true, 1),
                menu(6L, "Home", "/", "HEADER", 3L, true, 1)
        ));

        List<AdminMenuResponse> menus = menuService.getAdminSidebarMenus();

        assertThat(menus)
                .extracting(AdminMenuResponse::name)
                .containsExactly("Dashboard", "Posts");
        assertThat(menus)
                .extracting(AdminMenuResponse::area)
                .containsOnly("ADMIN");
    }

    @Test
    void getAdminMenusReturnsRootChildrenAsTreeWithoutRoot() {
        MenuRepository menuRepository = mock(MenuRepository.class);
        MenuService menuService = new MenuService(menuRepository);

        when(menuRepository.findAll()).thenReturn(List.of(
                menu(1L, "ROOT", "/__root", "ROOT", null, false, 0),
                menu(2L, "Admin Menu", "/__admin-menu", "ADMIN", 1L, false, 1),
                menu(3L, "Header Menu", "/__header-menu", "HEADER", 1L, false, 2),
                menu(4L, "Dashboard", "/admin", "ADMIN", 2L, true, 1),
                menu(5L, "Home", "/", "HEADER", 3L, true, 1)
        ));

        List<AdminMenuResponse> menus = menuService.getAdminMenus();

        assertThat(menus)
                .extracting(AdminMenuResponse::name)
                .containsExactly("Admin Menu", "Dashboard", "Header Menu", "Home");
        assertThat(menus)
                .extracting(AdminMenuResponse::depth)
                .containsExactly(0, 1, 0, 1);
    }

    @Test
    void saveAdminMenusRejectsParentFromDifferentArea() {
        MenuRepository menuRepository = mock(MenuRepository.class);
        MenuService menuService = new MenuService(menuRepository);

        when(menuRepository.findAll()).thenReturn(List.of(
                menu(1L, "ROOT", "/__root", "ROOT", null, false, 0),
                menu(2L, "Admin Menu", "/__admin-menu", "ADMIN", 1L, false, 1),
                menu(3L, "Header Menu", "/__header-menu", "HEADER", 1L, false, 2)
        ));

        assertThatThrownBy(() -> menuService.saveAdminMenus(List.of(
                new AdminMenuSaveRequest(null, "Wrong", "/wrong", "Active", true, 1, "HEADER", 2L)
        )))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("same area");
    }

    private static Menu menu(
            Long id,
            String name,
            String path,
            String area,
            Long parentId,
            Boolean visible,
            Integer displayOrder
    ) {
        Menu menu = new Menu(name, path, "Active", visible, displayOrder, area, parentId);
        setId(menu, id);
        return menu;
    }

    private static void setId(Menu menu, Long id) {
        try {
            Field field = Menu.class.getDeclaredField("id");
            field.setAccessible(true);
            field.set(menu, id);
        } catch (ReflectiveOperationException exception) {
            throw new IllegalStateException(exception);
        }
    }
}
