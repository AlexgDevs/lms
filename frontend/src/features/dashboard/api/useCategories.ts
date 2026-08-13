import { useQuery } from "@tanstack/react-query"
import { listCategoriesApiV1CategoriesGetOptions } from "@/client/@tanstack/react-query.gen"
import type { CategorySchema } from "@/client"

export const useCategories = () => {
  return useQuery({
    ...listCategoriesApiV1CategoriesGetOptions(),
  })
}

export const useCategoryBySlug = (slug?: string) => {
  const { data: categories = [] } = useCategories()
  if (!slug) return undefined
  return categories.find((category) => category.slug === slug)
}

export const useCategoryById = (categoryId?: string | null) => {
  const { data: categories = [] } = useCategories()
  if (!categoryId) return undefined
  return categories.find((category) => category.id === categoryId)
}

export const useCategoryTree = () => {
  const { data: categories = [] } = useCategories()
  const parents = categories.filter((category) => !category.parent_id)
  const tree: Array<CategorySchema & { children: CategorySchema[] }> = parents.map(
    (parent) => ({
      ...parent,
      children: categories.filter((category) => category.parent_id === parent.id),
    })
  )
  return { categories, tree }
}