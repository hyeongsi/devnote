package io.hyeongsi.devnotewebapp.menu;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@Transactional(readOnly = true)
public class MenuService {

    private final MenuRepository menuRepository;

    public MenuService(MenuRepository menuRepository) {
        this.menuRepository = menuRepository;
    }

    public List<AdminMenuResponse> getAdminMenus() {
        return menuRepository.findAll().stream()
                .sorted(Comparator.comparing(Menu::getDisplayOrder).thenComparing(Menu::getId))
                .map(menu -> new AdminMenuResponse(
                        menu.getId(),
                        menu.getName(),
                        menu.getPath(),
                        menu.getState(),
                        menu.getVisible(),
                        menu.getDisplayOrder()
                ))
                .toList();
    }

    public List<AdminMenuResponse> getPublicMenus() {
        return menuRepository.findAll().stream()
                .filter(menu -> Boolean.TRUE.equals(menu.getVisible()))
                .sorted(Comparator.comparing(Menu::getDisplayOrder).thenComparing(Menu::getId))
                .map(menu -> new AdminMenuResponse(
                        menu.getId(),
                        menu.getName(),
                        menu.getPath(),
                        menu.getState(),
                        menu.getVisible(),
                        menu.getDisplayOrder()
                ))
                .toList();
    }

    @Transactional
    public void saveAdminMenus(List<AdminMenuSaveRequest> requests) {
        List<Menu> existingMenus = menuRepository.findAll();
        Map<Long, Menu> existingMenuMap = new HashMap<>();

        for (Menu menu : existingMenus) {
            existingMenuMap.put(menu.getId(), menu);
        }

        Set<Long> retainedIds = new HashSet<>();

        for (AdminMenuSaveRequest request : requests) {
            if (request.id() == null) {
                menuRepository.save(new Menu(
                        request.name(),
                        request.path(),
                        request.state(),
                        request.visible(),
                        request.displayOrder()
                ));
                continue;
            }

            Menu menu = existingMenuMap.get(request.id());

            if (menu == null) {
                continue;
            }

            menu.updateAdminDetails(
                    request.name(),
                    request.path(),
                    request.state(),
                    request.visible(),
                    request.displayOrder()
            );
            retainedIds.add(menu.getId());
        }

        List<Menu> menusToDelete = existingMenus.stream()
                .filter(menu -> !retainedIds.contains(menu.getId()))
                .toList();

        if (!menusToDelete.isEmpty()) {
            menuRepository.deleteAll(menusToDelete);
        }
    }
}
