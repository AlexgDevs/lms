import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { showErrorToast, showSuccessToast } from "@/lib/toast"
import { getErrorMessage } from "@/lib/errors"
import {
  getBlocksApiV1CoursesCourseIdLessonsLessonIdBlocksGetOptions,
  getBlocksApiV1CoursesCourseIdLessonsLessonIdBlocksGetQueryKey,
  createBlockApiV1CoursesCourseIdLessonsLessonIdBlocksPostMutation,
  updateBlockApiV1CoursesCourseIdLessonsLessonIdBlocksBlockIdPatchMutation,
  deleteBlockApiV1CoursesCourseIdLessonsLessonIdBlocksBlockIdDeleteMutation,
} from "@/client/@tanstack/react-query.gen"
import type { BlockType } from "@/client" // Импортируй BlockType из твоего сгенерированного клиента (или типов)

interface UseBlocksParams {
  courseId?: string
  lessonId?: string
  onlyCreated?: boolean
}

export const useBlocks = ({ courseId, lessonId, onlyCreated = false }: UseBlocksParams) => {
  const queryClient = useQueryClient()

  // Проверяем валидность обоих ID перед отправкой запроса
  const isValidParams = Boolean(
    courseId && courseId !== "undefined" && lessonId && lessonId !== "undefined"
  )

  // --- QUERIES ---

  // Получение списка блоков для конкретного урока
  const {
    data: blocks,
    isLoading: isLoadingBlocks,
    error: blocksError,
    refetch: refetchBlocks,
  } = useQuery({
    ...getBlocksApiV1CoursesCourseIdLessonsLessonIdBlocksGetOptions({
      path: {
        course_id: courseId as string,
        lesson_id: lessonId as string,
      },
      query: {
        only_created: onlyCreated,
      },
    }),
    enabled: isValidParams,
  })

  // Функция для инвалидации кэша блоков
  const invalidateBlocksQuery = (targetCourseId?: string, targetLessonId?: string) => {
    const cId = targetCourseId || courseId
    const lId = targetLessonId || lessonId

    if (cId && lId) {
      queryClient.invalidateQueries({
        queryKey: getBlocksApiV1CoursesCourseIdLessonsLessonIdBlocksGetQueryKey({
          path: {
            course_id: cId,
            lesson_id: lId,
          },
        }),
      })
    }
  }

  // --- MUTATIONS ---

  // 1. Создание блока
  const createBlockMutation = useMutation({
    ...createBlockApiV1CoursesCourseIdLessonsLessonIdBlocksPostMutation(),
    onSuccess: (_, variables) => {
      showSuccessToast("Блок успешно создан")
      invalidateBlocksQuery(variables.path?.course_id, variables.path?.lesson_id)
    },
    onError: (err) => {
      showErrorToast(getErrorMessage(err) || "Ошибка при создании блока")
    },
  })

  // 2. Обновление блока
  const updateBlockMutation = useMutation({
    ...updateBlockApiV1CoursesCourseIdLessonsLessonIdBlocksBlockIdPatchMutation(),
    onSuccess: (_, variables) => {
      showSuccessToast("Блок успешно обновлен")
      invalidateBlocksQuery(variables.path?.course_id, variables.path?.lesson_id)
    },
    onError: (err) => {
      showErrorToast(getErrorMessage(err) || "Ошибка при обновлении блока")
    },
  })

  // 3. Удаление блока
  const deleteBlockMutation = useMutation({
    ...deleteBlockApiV1CoursesCourseIdLessonsLessonIdBlocksBlockIdDeleteMutation(),
    onSuccess: (_, variables) => {
      showSuccessToast("Блок успешно удален")
      invalidateBlocksQuery(variables.path?.course_id, variables.path?.lesson_id)
    },
    onError: (err) => {
      showErrorToast(getErrorMessage(err) || "Ошибка при удалении блока")
    },
  })

  // Вспомогательная обёртка для удобного создания блока
  const createBlockAsync = (title: string, blockType: BlockType, payload: Record<string, any>) => {
    if (!isValidParams) throw new Error("Не передан courseId или lessonId")

    return createBlockMutation.mutateAsync({
      path: {
        course_id: courseId as string,
        lesson_id: lessonId as string,
      },
      body: {
        title,
        block_type: blockType,
        payload,
      },
    })
  }

  // Вспомогательная обёртка для обновления блока
  const updateBlockAsync = (
    blockId: string, 
    data: { title?: string; block_type?: BlockType; payload?: Record<string, any> }
  ) => {
    if (!isValidParams) throw new Error("Не передан courseId или lessonId")

    return updateBlockMutation.mutateAsync({
      path: {
        course_id: courseId as string,
        lesson_id: lessonId as string,
        block_id: blockId,
      },
      body: data,
    })
  }

  // Вспомогательная обёртка для удаления блока
  const deleteBlockAsync = (blockId: string) => {
    if (!isValidParams) throw new Error("Не передан courseId или lessonId")

    return deleteBlockMutation.mutateAsync({
      path: {
        course_id: courseId as string,
        lesson_id: lessonId as string,
        block_id: blockId,
      },
    })
  }

  return {
    // Data & Query States
    blocks,
    isLoadingBlocks,
    blocksError,
    refetchBlocks,

    // Async wrappers
    createBlockAsync,
    updateBlockAsync,
    deleteBlockAsync,

    // Raw Mutations & States
    createBlock: createBlockMutation.mutate,
    isCreatingBlock: createBlockMutation.isPending,

    updateBlock: updateBlockMutation.mutate,
    isUpdatingBlock: updateBlockMutation.isPending,

    deleteBlock: deleteBlockMutation.mutate,
    isDeletingBlock: deleteBlockMutation.isPending,
  }
}