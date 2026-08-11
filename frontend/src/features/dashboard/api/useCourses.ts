import { useInfiniteQuery, useQuery } from "@tanstack/react-query"
import {
  getCoursesApiV1CoursesGetInfiniteOptions,
  getCoursesApiV1CoursesGetOptions,
} from "@/client/@tanstack/react-query.gen"

export const useEnrolledCourses = () => {
  return useQuery({
    ...getCoursesApiV1CoursesGetOptions({ query: { filter: "my" } }),
  })
}

export const useCreatedCourses = (limit = 12) => {
  return useQuery({
    ...getCoursesApiV1CoursesGetOptions({
      query: { filter: "created", limit, offset: 0 },
    }),
  })
}

export const useRecommendedCourses = (limit = 10) => {
  return useQuery({
    ...getCoursesApiV1CoursesGetOptions({
      query: { filter: "all", limit, offset: 0 },
    }),
  })
}

export const useCourseCatalog = (pageSize = 12) => {
  return useInfiniteQuery({
    ...getCoursesApiV1CoursesGetInfiniteOptions({
      query: { filter: "all", limit: pageSize },
    }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === pageSize ? allPages.length * pageSize : undefined,
  })
}
