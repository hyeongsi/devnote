package io.hyeongsi.devnotewebapp.category;

import java.util.List;

public interface CategoryRepositoryCustom {

    List<AdminCategoryResponse> findAdminCategories();

    List<BlogCategoryResponse> findVisibleBlogCategories();
}
