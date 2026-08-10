import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { showErrorToast, showSuccessToast } from "@/lib/toast"
import { getErrorMessage } from "@/lib/errors"
import {
  getCoursesApiV1CoursesGetOptions,
  getCoursesApiV1CoursesGetQueryKey,
  getCourseByIdApiV1CoursesCourseIdGetOptions,
  getCourseByIdApiV1CoursesCourseIdGetQueryKey,
  createCourseApiV1CoursesPostMutation,
  updateCourseApiV1CoursesCourseIdPatchMutation,
  deleteCourseApiV1CoursesCourseIdDeleteMutation,
  createMemberApiV1CoursesCourseIdMembersPostMutation,
} from "@/client/@tanstack/react-query.gen"

export const useCourses = (courseId?: string) => {
  const queryClient = useQueryClient()

  const isValidCourseId = Boolean(courseId && courseId !== "undefined")

  // --- QUERIES ---

  // 1. Общий публичный каталог всех курсов
  const {
    data: courses,
    isLoading: isLoadingCourses,
    error: coursesError,
  } = useQuery({
    ...getCoursesApiV1CoursesGetOptions({
      query: { filter: "all" },
    }),
  })

  // 2. Список курсов, СОЗДАННЫХ ТЕКУЩИМ ПОЛЬЗОВАТЕЛЕМ (Для TeachingPage)
  const {
    data: createdCourses,
    isLoading: isLoadingCreatedCourses,
    error: createdCoursesError,
  } = useQuery({
    ...getCoursesApiV1CoursesGetOptions({
      query: { filter: "created" },
    }),
  })

  // 3. Публичная деталка курса (для обычных студентов)
  const {
    data: course,
    isLoading: isLoadingCourse,
    error: courseError,
  } = useQuery({
    ...getCourseByIdApiV1CoursesCourseIdGetOptions({
      path: { course_id: courseId as string },
      query: { filter: "current" },
    }),
    enabled: isValidCourseId,
  })

  // 4. Деталка курса ДЛЯ АВТОРА (Для Конструктора/Билдера)
  const {
    data: authorCourse,
    isLoading: isLoadingAuthorCourse,
    error: authorCourseError,
  } = useQuery({
    ...getCourseByIdApiV1CoursesCourseIdGetOptions({
      path: { course_id: courseId as string },
      query: { filter: "author" }, // 🎯 Запрашиваем права автора
    }),
    enabled: isValidCourseId,
  })

  // --- MUTATIONS ---

  // Создание курса
  const createCourseMutation = useMutation({
    ...createCourseApiV1CoursesPostMutation(),
    onSuccess: () => {
      showSuccessToast("Курс успешно создан")
      queryClient.invalidateQueries({
        queryKey: getCoursesApiV1CoursesGetQueryKey(),
      })
    },
    onError: (err) => {
      showErrorToast(getErrorMessage(err) || "Ошибка при создании курса")
    },
  })

  // Обновление курса
  const updateCourseMutation = useMutation({
    ...updateCourseApiV1CoursesCourseIdPatchMutation(),
    onSuccess: (_, variables) => {
      showSuccessToast("Курс успешно обновлен")
      const targetCourseId = variables.path?.course_id

      queryClient.invalidateQueries({
        queryKey: getCoursesApiV1CoursesGetQueryKey(),
      })

      if (targetCourseId) {
        queryClient.invalidateQueries({
          queryKey: getCourseByIdApiV1CoursesCourseIdGetQueryKey({
            path: { course_id: targetCourseId },
          }),
        })
      }
    },
    onError: (err) => {
      showErrorToast(getErrorMessage(err) || "Ошибка при обновлении курса")
    },
  })

  // Удаление курса
  const deleteCourseMutation = useMutation({
    ...deleteCourseApiV1CoursesCourseIdDeleteMutation(),
    onSuccess: () => {
      showSuccessToast("Курс успешно удален")
      queryClient.invalidateQueries({
        queryKey: getCoursesApiV1CoursesGetQueryKey(),
      })
    },
    onError: (err) => {
      showErrorToast(getErrorMessage(err) || "Ошибка при удалении курса")
    },
  })

  // Запись на курс (Member)
  const enrollCourseMutation = useMutation({
    ...createMemberApiV1CoursesCourseIdMembersPostMutation(),
    onSuccess: (_, variables) => {
      showSuccessToast("Вы успешно записались на курс!")
      const targetCourseId = variables.path?.course_id

      queryClient.invalidateQueries({
        queryKey: getCoursesApiV1CoursesGetQueryKey(),
      })

      if (targetCourseId) {
        queryClient.invalidateQueries({
          queryKey: getCourseByIdApiV1CoursesCourseIdGetQueryKey({
            path: { course_id: targetCourseId },
          }),
        })
      }
    },
    onError: (err) => {
      showErrorToast(getErrorMessage(err) || "Ошибка при записи на курс")
    },
  })

  return {
    // Data
    courses,
    createdCourses,
    course,
    authorCourse,

    // Loadings
    isLoadingCourses,
    isLoadingCreatedCourses,
    isLoadingCourse,
    isLoadingAuthorCourse,

    // Errors
    coursesError,
    createdCoursesError,
    courseError,
    authorCourseError,

    // Mutations
    createCourse: createCourseMutation.mutate,
    createCourseAsync: createCourseMutation.mutateAsync,
    isCreatingCourse: createCourseMutation.isPending,

    updateCourse: updateCourseMutation.mutate,
    updateCourseAsync: updateCourseMutation.mutateAsync,
    isUpdatingCourse: updateCourseMutation.isPending,

    deleteCourse: deleteCourseMutation.mutate,
    deleteCourseAsync: deleteCourseMutation.mutateAsync,
    isDeletingCourse: deleteCourseMutation.isPending,

    enrollCourse: enrollCourseMutation.mutate,
    enrollCourseAsync: enrollCourseMutation.mutateAsync,
    isEnrollingCourse: enrollCourseMutation.isPending,
  }
}