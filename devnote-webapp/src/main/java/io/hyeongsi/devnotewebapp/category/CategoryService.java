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
      Map<Long, Category> existingCategoryMap = new HashMap<>();

      for (Category category : existingCategories) {
          existingCategoryMap.put(category.getId(), category);
      }

      Set<Long> retainedIds = new HashSet<>();

      for (AdminCategorySaveRequest request : requests) {
          if (request.id() == null) {
              categoryRepository.save(new Category(
                      request.slug(),
                      request.name(),
                      request.description(),
                      request.visible(),
                      request.displayOrder()
              ));
              continue;
          }

          Category category = existingCategoryMap.get(request.id());

          if (category == null) {
              continue;
          }

          category.updateAdminDetails(
                  request.slug(),
                  request.name(),
                  request.description(),
                  request.visible(),
                  request.displayOrder()
          );
          retainedIds.add(category.getId());
      }

      List<Category> categoriesToDelete = existingCategories.stream()
              .filter(category -> !retainedIds.contains(category.getId()))
              .toList();

      if (!categoriesToDelete.isEmpty()) {
          categoryRepository.deleteAll(categoriesToDelete);
      }
    }
}
