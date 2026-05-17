package io.hyeongsi.devnotewebapp.category;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

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
}
