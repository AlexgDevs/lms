import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { showErrorToast, showSuccessToast } from "@/lib/toast"
import { getErrorMessage } from "@/lib/errors"
import {
  approveCourseApiV1CoursesCourseIdModerationApprovePostMutation,
  getModerationQueueApiV1CoursesModerationQueueGetOptions,
  getModerationQueueApiV1CoursesModerationQueueGetQueryKey,
  rejectCourseApiV1CoursesCourseIdModerationRejectPostMutation,
} from "@/client/@tanstack/react-query.gen"

export const useModeration = () => {
  const queryClient = useQueryClient()

  const {
    data: queue,
    isLoading: isLoadingQueue,
    refetch: refetchQueue,
  } = useQuery({
    ...getModerationQueueApiV1CoursesModerationQueueGetOptions({
      query: { limit: 50, offset: 0 },
    }),
  })

  const invalidateQueue = () =>
    queryClient.invalidateQueries({
      queryKey: getModerationQueueApiV1CoursesModerationQueueGetQueryKey(),
    })

  const approveMutation = useMutation({
    ...approveCourseApiV1CoursesCourseIdModerationApprovePostMutation(),
    onSuccess: () => {
      showSuccessToast("Курс одобрен и опубликован")
      invalidateQueue()
    },
    onError: (err) =>
      showErrorToast(getErrorMessage(err) || "Ошибка при одобрении курса"),
  })

  const rejectMutation = useMutation({
    ...rejectCourseApiV1CoursesCourseIdModerationRejectPostMutation(),
    onSuccess: () => {
      showSuccessToast("Курс отклонён")
      invalidateQueue()
    },
    onError: (err) =>
      showErrorToast(getErrorMessage(err) || "Ошибка при отклонении курса"),
  })

  const approveCourse = (courseId: string) =>
    approveMutation.mutate({ path: { course_id: courseId } })

  const approveCourseAsync = (courseId: string) =>
    approveMutation.mutateAsync({ path: { course_id: courseId } })

  const rejectCourse = (courseId: string, reason: string) =>
    rejectMutation.mutate({
      path: { course_id: courseId },
      body: { reason },
    })

  const rejectCourseAsync = (courseId: string, reason: string) =>
    rejectMutation.mutateAsync({
      path: { course_id: courseId },
      body: { reason },
    })

  return {
    queue,
    isLoadingQueue,
    refetchQueue,
    approveCourse,
    approveCourseAsync,
    isApproving: approveMutation.isPending,
    rejectCourse,
    rejectCourseAsync,
    isRejecting: rejectMutation.isPending,
  }
}