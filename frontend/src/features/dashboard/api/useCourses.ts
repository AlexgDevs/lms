import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { client } from "@/client/client.gen"
import {
  createMemberApiV1CoursesCourseIdMembersPostMutation,
  getCourseByIdApiV1CoursesCourseIdGetQueryKey,
  getCoursesApiV1CoursesGetInfiniteOptions,
  getCoursesApiV1CoursesGetOptions,
  getCoursesApiV1CoursesGetQueryKey,
} from "@/client/@tanstack/react-query.gen"
import { getErrorMessage } from "@/lib/errors"
import { showErrorToast, showSuccessToast } from "@/lib/toast"

export const useEnrolledCourses = (enabled = true) => {
  return useQuery({
    ...getCoursesApiV1CoursesGetOptions({ query: { filter: "my" } }),
    enabled,
  })
}

export const useCreatedCourses = (limit = 12, enabled = true) => {
  return useQuery({
    ...getCoursesApiV1CoursesGetOptions({
      query: { filter: "created", limit, offset: 0 },
    }),
    enabled,
  })
}

export const useRecommendedCourses = (limit = 10) => {
  return useQuery({
    ...getCoursesApiV1CoursesGetOptions({
      query: { filter: "all", limit, offset: 0 },
    }),
  })
}

export const useEnrollCourse = () => {
  const queryClient = useQueryClient()

  return useMutation({
    ...createMemberApiV1CoursesCourseIdMembersPostMutation(),
    onSuccess: (_, variables) => {
      showSuccessToast("Вы успешно записались на курс!")
      queryClient.invalidateQueries({
        queryKey: getCoursesApiV1CoursesGetQueryKey(),
      })
      const courseId = variables.path?.course_id
      if (courseId) {
        queryClient.invalidateQueries({
          queryKey: getCourseByIdApiV1CoursesCourseIdGetQueryKey({
            path: { course_id: courseId },
            query: { filter: "current" },
          }),
        })
      }
    },
    onError: (err) => {
      showErrorToast(getErrorMessage(err) || "Ошибка при записи на курс")
    },
  })
}

export const useCourseCatalog = (
  pageSize = 12,
  category?: string,
  q?: string,
  certificateOnly = false,
) => {
  return useInfiniteQuery({
    ...getCoursesApiV1CoursesGetInfiniteOptions({
      query: {
        filter: "all",
        limit: pageSize,
        category: category || undefined,
        q: q || undefined,
        certificate_enabled: certificateOnly || undefined,
      },
    }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === pageSize ? allPages.length * pageSize : undefined,
  })
}

export const useUnenrollCourse = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (courseId: string) => {
      await client.delete({
        url: `/api/v1/courses/${courseId}/members/me`,
        throwOnError: true,
      })
    },
    onSuccess: (_, courseId) => {
      showSuccessToast("Вы отписались от курса")
      queryClient.invalidateQueries({
        queryKey: getCoursesApiV1CoursesGetQueryKey(),
      })
      queryClient.invalidateQueries({
        queryKey: getCourseByIdApiV1CoursesCourseIdGetQueryKey({
          path: { course_id: courseId },
          query: { filter: "current" },
        }),
      })
    },
    onError: (err) => {
      showErrorToast(getErrorMessage(err) || "Ошибка при отписке от курса")
    },
  })
}
