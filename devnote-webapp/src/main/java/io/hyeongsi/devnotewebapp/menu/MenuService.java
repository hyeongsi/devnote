package io.hyeongsi.devnotewebapp.menu;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

@Service
@Transactional(readOnly = true)
public class MenuService {

    private static final String ROOT_AREA = "ROOT";
    private static final String ADMIN_AREA = "ADMIN";
    private static final String HEADER_AREA = "HEADER";

    private final MenuRepository menuRepository;

    public MenuService(MenuRepository menuRepository) {
        this.menuRepository = menuRepository;
    }

    public List<AdminMenuResponse> getAdminMenus() {
        List<Menu> menus = menuRepository.findAll();
        Long rootId = findRootId(menus);

        return flattenTree(menus, rootId, false);
    }

    public List<AdminMenuResponse> getPublicMenus() {
        return getVisibleAreaChildren(HEADER_AREA);
    }

    public List<AdminMenuResponse> getAdminSidebarMenus() {
        return getVisibleAreaChildren(ADMIN_AREA);
    }

    @Transactional
    public void saveAdminMenus(List<AdminMenuSaveRequest> requests) {
        List<Menu> existingMenus = menuRepository.findAll();
        Map<Long, Menu> existingMenuMap = new HashMap<>();

        for (Menu menu : existingMenus) {
            existingMenuMap.put(menu.getId(), menu);
        }

        validateParentAreas(requests, existingMenuMap);

        Set<Long> retainedIds = new HashSet<>();
        Long rootId = findRootId(existingMenus);

        for (Menu menu : existingMenus) {
            if (Objects.equals(menu.getId(), rootId) || Objects.equals(menu.getParentId(), rootId)) {
                retainedIds.add(menu.getId());
            }
        }

        for (AdminMenuSaveRequest request : requests) {
            if (request.id() == null) {
                menuRepository.save(new Menu(
                        request.name(),
                        request.path(),
                        request.state(),
                        request.visible(),
                        request.displayOrder(),
                        normalizeArea(request.area()),
                        request.parentId()
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
                    request.displayOrder(),
                    normalizeArea(request.area()),
                    request.parentId()
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

    private List<AdminMenuResponse> getVisibleAreaChildren(String area) {
        List<Menu> menus = menuRepository.findAll();
        Long rootId = findRootId(menus);

        Set<Long> areaGroupIds = new HashSet<>();
        if (rootId != null) {
            for (Menu menu : menus) {
                if (Objects.equals(menu.getParentId(), rootId) && area.equals(normalizeArea(menu.getArea()))) {
                    areaGroupIds.add(menu.getId());
                }
            }
        }

        return flattenTree(menus, rootId, false).stream()
                .filter(menu -> area.equals(menu.area()))
                .filter(menu -> Boolean.TRUE.equals(menu.visible()))
                .filter(menu -> !areaGroupIds.contains(menu.id()))
                .toList();
    }

    private List<AdminMenuResponse> flattenTree(List<Menu> menus, Long rootId, boolean includeRoot) {
        Map<Long, List<Menu>> childrenByParentId = new HashMap<>();

        for (Menu menu : menus) {
            childrenByParentId.computeIfAbsent(menu.getParentId(), ignored -> new ArrayList<>()).add(menu);
        }

        for (List<Menu> children : childrenByParentId.values()) {
            children.sort(menuComparator());
        }

        List<AdminMenuResponse> responses = new ArrayList<>();
        Menu root = menus.stream()
                .filter(menu -> Objects.equals(menu.getId(), rootId))
                .findFirst()
                .orElse(null);

        if (includeRoot && root != null) {
            responses.add(toResponse(root, 0));
        }

        appendChildren(responses, childrenByParentId, rootId, 0);
        return responses;
    }

    private void appendChildren(
            List<AdminMenuResponse> responses,
            Map<Long, List<Menu>> childrenByParentId,
            Long parentId,
            int depth
    ) {
        List<Menu> children = childrenByParentId.getOrDefault(parentId, List.of());

        for (Menu child : children) {
            responses.add(toResponse(child, depth));
            appendChildren(responses, childrenByParentId, child.getId(), depth + 1);
        }
    }

    private AdminMenuResponse toResponse(Menu menu, int depth) {
        return new AdminMenuResponse(
                menu.getId(),
                menu.getName(),
                menu.getPath(),
                menu.getState(),
                menu.getVisible(),
                menu.getDisplayOrder(),
                normalizeArea(menu.getArea()),
                menu.getParentId(),
                depth
        );
    }

    private void validateParentAreas(List<AdminMenuSaveRequest> requests, Map<Long, Menu> existingMenuMap) {
        Map<Long, String> areasById = new HashMap<>();

        for (Menu menu : existingMenuMap.values()) {
            areasById.put(menu.getId(), normalizeArea(menu.getArea()));
        }

        for (AdminMenuSaveRequest request : requests) {
            if (request.id() != null) {
                areasById.put(request.id(), normalizeArea(request.area()));
            }
        }

        for (AdminMenuSaveRequest request : requests) {
            Long parentId = request.parentId();

            if (parentId == null) {
                throw new IllegalArgumentException("Menu parent is required.");
            }

            String parentArea = areasById.get(parentId);

            if (parentArea == null) {
                throw new IllegalArgumentException("Menu parent does not exist.");
            }

            String area = normalizeArea(request.area());

            if (ROOT_AREA.equals(parentArea) && (ADMIN_AREA.equals(area) || HEADER_AREA.equals(area))) {
                continue;
            }

            if (!area.equals(parentArea)) {
                throw new IllegalArgumentException("Menu and parent must be in the same area.");
            }
        }
    }

    private Long findRootId(List<Menu> menus) {
        return menus.stream()
                .filter(menu -> ROOT_AREA.equals(normalizeArea(menu.getArea())))
                .map(Menu::getId)
                .findFirst()
                .orElse(null);
    }

    private String normalizeArea(String area) {
        if (area == null || area.isBlank()) {
            return HEADER_AREA;
        }

        return area.trim().toUpperCase();
    }

    private Comparator<Menu> menuComparator() {
        return Comparator.comparing(Menu::getDisplayOrder)
                .thenComparing(Menu::getId, Comparator.nullsLast(Long::compareTo));
    }
}
