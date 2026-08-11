import { useMutation, useQueryClient } from "@tanstack/react-query"

import { showErrorToast, showSuccessToast } from "@/lib/toast"
import { getErrorMessage } from "@/lib/errors"
import {
  getCourseByIdApiV1CoursesCourseIdGetQueryKey,
  getCoursesApiV1CoursesGetQueryKey,
  removeCourseCoverApiV1CoursesCourseIdMediaDeleteMutation,
  uploadCourseCoverApiV1CoursesCourseIdMediaPostMutation,
} from "@/client/@tanstack/react-query.gen"

export const useCourseMedia = (courseId?: string) => {
  const queryClient = useQueryClient()

  const invalidateCourse = () => {
    queryClient.invalidateQueries({
      queryKey: getCoursesApiV1CoursesGetQueryKey(),
    })

    if (courseId) {
      queryClient.invalidateQueries({
        queryKey: getCourseByIdApiV1CoursesCourseIdGetQueryKey({
          path: { course_id: courseId },
        }),
      })
    }
  }

  const uploadCoverMutation = useMutation({
    ...uploadCourseCoverApiV1CoursesCourseIdMediaPostMutation(),
    onSuccess: () => {
      showSuccessToast("Обложка обновлена")
      invalidateCourse()
    },
    onError: (err) => {
      showErrorToast(getErrorMessage(err) || "Ошибка при загрузке обложки")
    },
  })

  const removeCoverMutation = useMutation({
    ...removeCourseCoverApiV1CoursesCourseIdMediaDeleteMutation(),
    onSuccess: () => {
      showSuccessToast("Обложка удалена")
      invalidateCourse()
    },
    onError: (err) => {
      showErrorToast(getErrorMessage(err) || "Ошибка при удалении обложки")
    },
  })

  return {
    uploadCourseCoverAsync: (file: File) =>
      uploadCoverMutation.mutateAsync({
        path: { course_id: String(courseId) },
        body: { file, is_public: true },
      }),
    removeCourseCoverAsync: () =>
      removeCoverMutation.mutateAsync({
        path: { course_id: String(courseId) },
      }),
    isUploadingCover: uploadCoverMutation.isPending,
    isRemovingCover: removeCoverMutation.isPending,
  }
}
