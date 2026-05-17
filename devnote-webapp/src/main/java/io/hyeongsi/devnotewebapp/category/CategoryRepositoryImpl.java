package io.hyeongsi.devnotewebapp.category;

import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQueryFactory;
import org.springframework.stereotype.Repository;

import java.util.List;

import static io.hyeongsi.devnotewebapp.category.QCategory.category;
import static io.hyeongsi.devnotewebapp.post.QPost.post;

@Repository
public class CategoryRepositoryImpl implements CategoryRepositoryCustom {

    private final JPAQueryFactory queryFactory;

    public CategoryRepositoryImpl(JPAQueryFactory queryFactory) {
        this.queryFactory = queryFactory;
    }

    @Override
    public List<AdminCategoryResponse> findAdminCategories() {
        return queryFactory
                .select(Projections.constructor(
                        AdminCategoryResponse.class,
                        category.id,
                        category.slug,
                        category.name,
                        category.description,
                        post.id.count(),
                        category.visible,
                        category.displayOrder
                ))
                .from(category)
                .leftJoin(post).on(post.category.eq(category))
                .groupBy(
                        category.id,
                        category.slug,
                        category.name,
                        category.description,
                        category.visible,
                        category.displayOrder
                )
                .orderBy(category.displayOrder.asc(), category.id.asc())
                .fetch();
    }

    @Override
    public List<BlogCategoryResponse> findVisibleBlogCategories() {
        return queryFactory
                .select(Projections.constructor(
                        BlogCategoryResponse.class,
                        category.id,
                        category.slug,
                        category.name,
                        category.description,
                        post.id.count(),
                        category.visible,
                        category.displayOrder
                ))
                .from(category)
                .leftJoin(post).on(post.category.eq(category))
                .where(category.visible.isTrue())
                .groupBy(
                        category.id,
                        category.slug,
                        category.name,
                        category.description,
                        category.visible,
                        category.displayOrder
                )
                .orderBy(category.displayOrder.asc(), category.id.asc())
                .fetch();
    }
}
