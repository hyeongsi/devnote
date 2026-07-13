package io.hyeongsi.devnotewebapp.category;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@Transactional(readOnly = true)
public class CategoryService {

    private final CategoryRepository categoryRepository;

    public CategoryService(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    public List<AdminCategoryResponse> getAdminCategories() {
        return categoryRepository.findAdminCategories();
    }

    public List<BlogCategoryResponse> getBlogCategories() {
        return categoryRepository.findVisibleBlogCategories();
    }

    @Transactional
    public void saveAdminCategories(List<AdminCategorySaveRequest> requests) {
        List<Category> existingCategories = categoryRepository.findAll();
        Map<Long, Category> categoriesById = mapById(existingCategories);
        Set<Long> retainedIds = new HashSet<>();

        for (AdminCategorySaveRequest request : requests) {
            applyAdminSaveRequest(request, categoriesById, retainedIds);
        }

        deleteRemovedCategories(existingCategories, retainedIds);
    }

    private Map<Long, Category> mapById(List<Category> categories) {
        Map<Long, Category> categoriesById = new HashMap<>();

        for (Category category : categories) {
            categoriesById.put(category.getId(), category);
        }

        return categoriesById;
    }

    private void applyAdminSaveRequest(
            AdminCategorySaveRequest request,
            Map<Long, Category> categoriesById,
            Set<Long> retainedIds
    ) {
        if (request.id() == null) {
            createCategory(request);
            return;
        }

        Category category = categoriesById.get(request.id());
        if (category == null) {
            return;
        }

        updateCategory(category, request);
        retainedIds.add(category.getId());
    }

    private void createCategory(AdminCategorySaveRequest request) {
        categoryRepository.save(new Category(
                request.slug(),
                request.name(),
                request.description(),
                request.visible(),
                request.displayOrder()
        ));
    }

    private void updateCategory(Category category, AdminCategorySaveRequest request) {
        category.updateAdminDetails(
                request.slug(),
                request.name(),
                request.description(),
                request.visible(),
                request.displayOrder()
        );
    }

    private void deleteRemovedCategories(List<Category> existingCategories, Set<Long> retainedIds) {
        List<Category> categoriesToDelete = existingCategories.stream()
                .filter(category -> !retainedIds.contains(category.getId()))
                .toList();

        if (!categoriesToDelete.isEmpty()) {
            categoryRepository.deleteAll(categoriesToDelete);
        }
    }
}
