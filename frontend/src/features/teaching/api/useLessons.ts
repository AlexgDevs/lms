import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { showErrorToast, showSuccessToast } from "@/lib/toast"
import { getErrorMessage } from "@/lib/errors"
import {
  getLessonsApiV1CoursesCourseIdModulesModuleIdLessonsGetOptions,
  getLessonsApiV1CoursesCourseIdModulesModuleIdLessonsGetQueryKey,
  createLessonApiV1CoursesCourseIdModulesModuleIdLessonsPostMutation,
  updateLessonApiV1CoursesCourseIdModulesModuleIdLessonsLessonIdPatchMutation,
  deleteLessonApiV1CoursesCourseIdModulesModuleIdLessonsLessonIdDeleteMutation,
  reorderLessonsApiV1CoursesCourseIdModulesModuleIdLessonsReorderPatchMutation,
} from "@/client/@tanstack/react-query.gen"
import { applyOrderToCache } from "@/lib/dnd"

interface UseLessonsParams {
  courseId?: string
  moduleId?: string
  onlyCreated?: boolean
}

export const useLessons = ({ courseId, moduleId, onlyCreated = false }: UseLessonsParams) => {
  const queryClient = useQueryClient()

  // Проверяем валидность обоих ID перед отправкой запроса
  const isValidParams = Boolean(
    courseId && courseId !== "undefined" && moduleId && moduleId !== "undefined"
  )

  // --- QUERIES ---

  // Получение списка уроков для конкретного модуля
  const {
    data: lessons,
    isLoading: isLoadingLessons,
    error: lessonsError,
    refetch: refetchLessons,
  } = useQuery({
    ...getLessonsApiV1CoursesCourseIdModulesModuleIdLessonsGetOptions({
      path: {
        course_id: courseId as string,
        module_id: moduleId as string,
      },
      query: {
        only_created: onlyCreated,
      },
    }),
    enabled: isValidParams,
  })

  // --- MUTATIONS ---

  // 1. Создание урока
  const createLessonMutation = useMutation({
    ...createLessonApiV1CoursesCourseIdModulesModuleIdLessonsPostMutation(),
    onSuccess: () => {
      showSuccessToast("Урок успешно создан")
      if (isValidParams) {
        queryClient.invalidateQueries({
          queryKey: getLessonsApiV1CoursesCourseIdModulesModuleIdLessonsGetQueryKey({
            path: {
              course_id: courseId as string,
              module_id: moduleId as string,
            },
          }),
        })
      }
    },
    onError: (err) => {
      showErrorToast(getErrorMessage(err) || "Ошибка при создании урока")
    },
  })

  // 2. Обновление урока
  const updateLessonMutation = useMutation({
    ...updateLessonApiV1CoursesCourseIdModulesModuleIdLessonsLessonIdPatchMutation(),
    onSuccess: (_, variables) => {
      showSuccessToast("Урок успешно обновлен")
      
      const targetCourseId = variables.path?.course_id || courseId
      const targetModuleId = variables.path?.module_id || moduleId

      if (targetCourseId && targetModuleId) {
        queryClient.invalidateQueries({
          queryKey: getLessonsApiV1CoursesCourseIdModulesModuleIdLessonsGetQueryKey({
            path: {
              course_id: targetCourseId,
              module_id: targetModuleId,
            },
          }),
        })
      }
    },
    onError: (err) => {
      showErrorToast(getErrorMessage(err) || "Ошибка при обновлении урока")
    },
  })

  // 3. Удаление урока
  const deleteLessonMutation = useMutation({
    ...deleteLessonApiV1CoursesCourseIdModulesModuleIdLessonsLessonIdDeleteMutation(),
    onSuccess: (_, variables) => {
      showSuccessToast("Урок успешно удален")

      const targetCourseId = variables.path?.course_id || courseId
      const targetModuleId = variables.path?.module_id || moduleId

      if (targetCourseId && targetModuleId) {
        queryClient.invalidateQueries({
          queryKey: getLessonsApiV1CoursesCourseIdModulesModuleIdLessonsGetQueryKey({
            path: {
              course_id: targetCourseId,
              module_id: targetModuleId,
            },
          }),
        })
      }
    },
    onError: (err) => {
      showErrorToast(getErrorMessage(err) || "Ошибка при удалении урока")
    },
  })

  // Вспомогательные функции-обёртки для создания и редактирования без ручной передачи path
  const createLessonAsync = (title: string, description?: string) => {
    if (!isValidParams) throw new Error("Не передан courseId или moduleId")
    
    return createLessonMutation.mutateAsync({
      path: {
        course_id: courseId as string,
        module_id: moduleId as string,
      },
      body: {
        title,
        description,
      },
    })
  }

  // 4. Переупорядочивание уроков
  const reorderLessonMutation = useMutation({
    ...reorderLessonsApiV1CoursesCourseIdModulesModuleIdLessonsReorderPatchMutation(),
    onMutate: async (variables) => {
      const targetCourseId = variables.path?.course_id || courseId
      const targetModuleId = variables.path?.module_id || moduleId
      const queryKey = getLessonsApiV1CoursesCourseIdModulesModuleIdLessonsGetQueryKey({
        path: { course_id: targetCourseId as string, module_id: targetModuleId as string },
      })
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData(queryKey)

      queryClient.setQueryData(queryKey, (old: unknown) =>
        applyOrderToCache(old, variables.body.ordered_ids),
      )

      return { previous, queryKey }
    },
    onError: (err, _variables, context) => {
      if (context?.queryKey && context?.previous !== undefined) {
        queryClient.setQueryData(context.queryKey, context.previous)
      }
      showErrorToast(getErrorMessage(err) || "Ошибка при изменении порядка уроков")
    },
    onSuccess: (_, variables) => {
      const targetCourseId = variables.path?.course_id || courseId
      const targetModuleId = variables.path?.module_id || moduleId

      if (targetCourseId && targetModuleId) {
        queryClient.invalidateQueries({
          queryKey: getLessonsApiV1CoursesCourseIdModulesModuleIdLessonsGetQueryKey({
            path: {
              course_id: targetCourseId,
              module_id: targetModuleId,
            },
          }),
        })
      }
    },
  })

  const reorderLessonsAsync = async (orderedIds: string[]) => {
    if (!isValidParams) throw new Error("Не передан courseId или moduleId")

    return reorderLessonMutation.mutateAsync({
      path: {
        course_id: courseId as string,
        module_id: moduleId as string,
      },
      body: {
        ordered_ids: orderedIds,
      },
    })
  }

  return {
    // Data & Query States
    lessons,
    isLoadingLessons,
    lessonsError,
    refetchLessons,

    // Helpers
    createLessonAsync,

    // Raw Mutations
    createLesson: createLessonMutation.mutate,
    isCreatingLesson: createLessonMutation.isPending,

    updateLesson: updateLessonMutation.mutate,
    updateLessonAsync: updateLessonMutation.mutateAsync,
    isUpdatingLesson: updateLessonMutation.isPending,

    deleteLesson: deleteLessonMutation.mutate,
    deleteLessonAsync: deleteLessonMutation.mutateAsync,
    isDeletingLesson: deleteLessonMutation.isPending,

    reorderLessonsAsync,
    isReordering: reorderLessonMutation.isPending,
  }
}