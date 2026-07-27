import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import useCustomToast from "@/hooks/useCustomToast"
import { getErrorMessage } from "@/utils"
import {
  createCourseApiV1CoursesPostMutation,
  createMemberApiV1CoursesCourseIdEnrollPostMutation,
  deleteCourseApiV1CoursesCourseIdDeleteMutation,
  getAuthorCourseByIdApiV1CoursesAuthorCourseIdGetOptions,
  getAuthorCourseByIdApiV1CoursesAuthorCourseIdGetQueryKey,
  getCourseByIdApiV1CoursesCourseIdGetOptions,
  getCourseByIdApiV1CoursesCourseIdGetQueryKey,
  getCreatedCoursesApiV1CoursesCreatedGetOptions,
  getCreatedCoursesApiV1CoursesCreatedGetQueryKey,
  getMyCoursesApiV1CoursesMyGetOptions,
  getMyCoursesApiV1CoursesMyGetQueryKey,
  updateCourseApiV1CoursesCourseIdPatchMutation,
} from "@/client/@tanstack/react-query.gen"

export const useCourses = (courseId?: string) => {
  const queryClient = useQueryClient()
  const { showErrorToast, showSuccessToast } = useCustomToast()

  // --- QUERIES ---

  // Курсы, на которые пользователь записан
  const { data: myCourses, isLoading: isLoadingMyCourses } = useQuery({
    ...getMyCoursesApiV1CoursesMyGetOptions(),
  })

  // Созданные пользователем курсы (для авторов)
  const { data: createdCourses, isLoading: isLoadingCreatedCourses } = useQuery({
    ...getCreatedCoursesApiV1CoursesCreatedGetOptions(),
  })

  // Деталка курса (Публичная)
  const {
    data: course,
    isLoading: isLoadingCourse,
    error: courseError,
  } = useQuery({
    ...getCourseByIdApiV1CoursesCourseIdGetOptions({
      path: { course_id: courseId! },
    }),
    enabled: Boolean(courseId),
  })

  // Деталка курса для Автора (включает черновики)
  const {
    data: authorCourse,
    isLoading: isLoadingAuthorCourse,
    error: authorCourseError,
  } = useQuery({
    ...getAuthorCourseByIdApiV1CoursesAuthorCourseIdGetOptions({
      path: { course_id: courseId! },
    }),
    enabled: Boolean(courseId),
  })

  // --- MUTATIONS ---

  // Создание курса
  const createCourseMutation = useMutation({
    ...createCourseApiV1CoursesPostMutation(),
    onSuccess: () => {
      showSuccessToast("Курс успешно создан")
      queryClient.invalidateQueries({
        queryKey: getCreatedCoursesApiV1CoursesCreatedGetQueryKey(),
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
      const currentCourseId = variables.path.course_id
      
      queryClient.invalidateQueries({
        queryKey: getCreatedCoursesApiV1CoursesCreatedGetQueryKey(),
      })
      queryClient.invalidateQueries({
        queryKey: getAuthorCourseByIdApiV1CoursesAuthorCourseIdGetQueryKey({
          path: { course_id: currentCourseId },
        }),
      })
      queryClient.invalidateQueries({
        queryKey: getCourseByIdApiV1CoursesCourseIdGetQueryKey({
          path: { course_id: currentCourseId },
        }),
      })
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
        queryKey: getCreatedCoursesApiV1CoursesCreatedGetQueryKey(),
      })
    },
    onError: (err) => {
      showErrorToast(getErrorMessage(err) || "Ошибка при удалении курса")
    },
  })

  // Запись на курс (Enroll)
  const enrollCourseMutation = useMutation({
    ...createMemberApiV1CoursesCourseIdEnrollPostMutation(),
    onSuccess: () => {
      showSuccessToast("Вы успешно записались на курс!")
      queryClient.invalidateQueries({
        queryKey: getMyCoursesApiV1CoursesMyGetQueryKey(),
      })
    },
    onError: (err) => {
      showErrorToast(getErrorMessage(err) || "Ошибка при записи на курс")
    },
  })

  return {
    // Data
    myCourses,
    createdCourses,
    course,
    authorCourse,

    // Loadings
    isLoadingMyCourses,
    isLoadingCreatedCourses,
    isLoadingCourse,
    isLoadingAuthorCourse,

    // Errors
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