import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import useCustomToast from "@/hooks/useCustomToast"
import { getErrorMessage } from "@/utils"
import {
  createCourseApiV1CoursesPostMutation,
  createMemberApiV1CoursesCourseIdEnrollPostMutation,
  deleteCourseApiV1CoursesCourseIdDeleteMutation,
  getCreatedCoursesApiV1CoursesCreatedGetOptions,
  getMyCoursesApiV1CoursesMyGetOptions,
  updateCourseApiV1CoursesCourseIdPatchMutation,
} from "@/client/@tanstack/react-query.gen"

export const useCourses = () => {
  const queryClient = useQueryClient()
  const { showErrorToast, showSuccessToast } = useCustomToast()

  // --- QUERIES ---

  // Курсы, на которые пользователь записан
  const { data: myCourses, isLoading: isLoadingMyCourses } = useQuery({
    ...getMyCoursesApiV1CoursesMyGetOptions(),
  })

  // Созданные пользователем курсы (для авторов/преподавателей)
  const { data: createdCourses, isLoading: isLoadingCreatedCourses } = useQuery({
    ...getCreatedCoursesApiV1CoursesCreatedGetOptions(),
  })

  // --- MUTATIONS ---

  // Создание курса
  const createCourseMutation = useMutation({
    ...createCourseApiV1CoursesPostMutation(),
    onSuccess: () => {
      showSuccessToast("Course created successfully.")
      queryClient.invalidateQueries({
        queryKey: getCreatedCoursesApiV1CoursesCreatedGetOptions().queryKey,
      })
    },
    onError: (error) => showErrorToast(getErrorMessage(error)),
  })

  // Обновление курса
  const updateCourseMutation = useMutation({
    ...updateCourseApiV1CoursesCourseIdPatchMutation(),
    onSuccess: () => {
      showSuccessToast("Course updated successfully.")
      queryClient.invalidateQueries({
        queryKey: getCreatedCoursesApiV1CoursesCreatedGetOptions().queryKey,
      })
    },
    onError: (error) => showErrorToast(getErrorMessage(error)),
  })

  // Удаление курса
  const deleteCourseMutation = useMutation({
    ...deleteCourseApiV1CoursesCourseIdDeleteMutation(),
    onSuccess: () => {
      showSuccessToast("Course deleted successfully.")
      queryClient.invalidateQueries({
        queryKey: getCreatedCoursesApiV1CoursesCreatedGetOptions().queryKey,
      })
    },
    onError: (error) => showErrorToast(getErrorMessage(error)),
  })

  // Запись на курс (Enroll)
  const enrollCourseMutation = useMutation({
    ...createMemberApiV1CoursesCourseIdEnrollPostMutation(),
    onSuccess: () => {
      showSuccessToast("Successfully enrolled in the course!")
      queryClient.invalidateQueries({
        queryKey: getMyCoursesApiV1CoursesMyGetOptions().queryKey,
      })
    },
    onError: (error) => showErrorToast(getErrorMessage(error)),
  })

  return {
    // Queries
    myCourses,
    isLoadingMyCourses,
    createdCourses,
    isLoadingCreatedCourses,
    // Mutations
    createCourseMutation,
    updateCourseMutation,
    deleteCourseMutation,
    enrollCourseMutation,
  }
}

export default useCourses