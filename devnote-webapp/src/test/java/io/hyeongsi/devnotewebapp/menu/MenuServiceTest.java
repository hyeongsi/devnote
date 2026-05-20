package io.hyeongsi.devnotewebapp.menu;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class MenuServiceTest {

    @Test
    void getPublicMenusReturnsOnlyVisibleMenusInDisplayOrder() {
        MenuRepository menuRepository = mock(MenuRepository.class);
        MenuService menuService = new MenuService(menuRepository);

        when(menuRepository.findAll()).thenReturn(List.of(
                new Menu("Hidden", "/hidden", "운영 중", false, 1),
                new Menu("Blog", "/posts", "운영 중", true, 3),
                new Menu("Home", "/", "운영 중", true, 2)
        ));

        List<AdminMenuResponse> menus = menuService.getPublicMenus();

        assertThat(menus)
                .extracting(AdminMenuResponse::name)
                .containsExactly("Home", "Blog");
        assertThat(menus)
                .extracting(AdminMenuResponse::path)
                .containsExactly("/", "/posts");
    }
}
