package io.hyeongsi.devnotewebapp.menu;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.hamcrest.Matchers.hasSize;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class MenuControllerTest {

    @Test
    void getMenusReturnsPublicMenuItems() throws Exception {
        MenuService menuService = mock(MenuService.class);
        MockMvc mockMvc = MockMvcBuilders.standaloneSetup(new MenuController(menuService)).build();

        when(menuService.getPublicMenus()).thenReturn(List.of(
                new AdminMenuResponse(1L, "Home", "/", "Active", true, 1, "HEADER", 3L, 1),
                new AdminMenuResponse(2L, "Blog", "/posts", "Active", true, 2, "HEADER", 3L, 1)
        ));

        mockMvc.perform(get("/api/menus").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].name").value("Home"))
                .andExpect(jsonPath("$[0].path").value("/"))
                .andExpect(jsonPath("$[0].visible").value(true))
                .andExpect(jsonPath("$[1].name").value("Blog"))
                .andExpect(jsonPath("$[1].path").value("/posts"));
    }

    @Test
    void getAdminSidebarMenusReturnsAdminMenuItems() throws Exception {
        MenuService menuService = mock(MenuService.class);
        MockMvc mockMvc = MockMvcBuilders.standaloneSetup(new MenuController(menuService)).build();

        when(menuService.getAdminSidebarMenus()).thenReturn(List.of(
                new AdminMenuResponse(5L, "Dashboard", "/admin", "Active", true, 1, "ADMIN", 2L, 1),
                new AdminMenuResponse(6L, "Menus", "/admin/menus", "Active", true, 2, "ADMIN", 2L, 1)
        ));

        mockMvc.perform(get("/api/menus/admin/sidebar").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].area").value("ADMIN"))
                .andExpect(jsonPath("$[0].name").value("Dashboard"))
                .andExpect(jsonPath("$[1].path").value("/admin/menus"));
    }
}
