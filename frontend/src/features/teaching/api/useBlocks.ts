import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { showErrorToast, showSuccessToast } from "@/lib/toast"
import { getErrorMessage } from "@/lib/errors"
import {
  getBlocksApiV1CoursesCourseIdLessonsLessonIdBlocksGetOptions,
  getBlocksApiV1CoursesCourseIdLessonsLessonIdBlocksGetQueryKey,
  createBlockApiV1CoursesCourseIdLessonsLessonIdBlocksPostMutation,
  updateBlockApiV1CoursesCourseIdLessonsLessonIdBlocksBlockIdPatchMutation,
  deleteBlockApiV1CoursesCourseIdLessonsLessonIdBlocksBlockIdDeleteMutation,
  reorderBlocksApiV1CoursesCourseIdLessonsLessonIdBlocksReorderPatchMutation,
  uploadBlockMediaApiV1CoursesCourseIdLessonsLessonIdBlocksBlockIdMediaPostMutation,
} from "@/client/@tanstack/react-query.gen"
import type { BlockType } from "@/client" // Импортируй BlockType из твоего сгенерированного клиента (или типов)
import { applyOrderToCache } from "@/lib/dnd"

/**
 * Заменяет обновлённый блок в кэше списка (массив или `{ items }`),
 * не трогая остальные записи и не вызывая рефетч.
 */
function mergeBlockIntoCache(old: unknown, updated: { id?: string } | null | undefined): unknown {
  if (!updated?.id || !old) return old
  const patch = (list: unknown[]): unknown[] =>
    list.map((item) =>
      item && typeof item === "object" && "id" in item && item.id === updated.id
        ? { ...item, ...updated }
        : item,
    )
  if (Array.isArray(old)) return patch(old)
  const obj = old as { items?: unknown[] }
  if (Array.isArray(obj.items)) return { ...obj, items: patch(obj.items) }
  return old
}

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

  // 2. Обновление блока — без тоста и без рефетча: патчим блок прямо в кэше
  //    (автосохранение при вводе не должно ни спамить тостами, ни мигать списком)
  const updateBlockMutation = useMutation({
    ...updateBlockApiV1CoursesCourseIdLessonsLessonIdBlocksBlockIdPatchMutation(),
    onSuccess: (updated, variables) => {
      const targetCourseId = variables.path?.course_id || courseId
      const targetLessonId = variables.path?.lesson_id || lessonId
      if (!targetCourseId || !targetLessonId) return
      const queryKey = getBlocksApiV1CoursesCourseIdLessonsLessonIdBlocksGetQueryKey({
        path: { course_id: targetCourseId, lesson_id: targetLessonId },
      })
      queryClient.setQueryData(queryKey, (old: unknown) => mergeBlockIntoCache(old, updated))
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

  // 5. Загрузка медиа в блок
  const uploadBlockMediaMutation = useMutation({
    ...uploadBlockMediaApiV1CoursesCourseIdLessonsLessonIdBlocksBlockIdMediaPostMutation(),
    onSuccess: (_, variables) => {
      showSuccessToast("Файл загружен")
      invalidateBlocksQuery(variables.path?.course_id, variables.path?.lesson_id)
    },
    onError: (err) => {
      showErrorToast(getErrorMessage(err) || "Ошибка при загрузке файла")
    },
  })

  // Вспомогательная обёртка для удобного создания блока
  const createBlockAsync = (title: string, blockType: BlockType, payload: Record<string, unknown>) => {
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
    data: { title?: string; block_type?: BlockType; payload?: Record<string, unknown> }
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

  // Вспомогательная обёртка для загрузки медиа в блок
  const uploadBlockMediaAsync = (blockId: string, file: File, isPublic = false) => {
    if (!isValidParams) throw new Error("Не передан courseId или lessonId")

    return uploadBlockMediaMutation.mutateAsync({
      path: {
        course_id: courseId as string,
        lesson_id: lessonId as string,
        block_id: blockId,
      },
      body: {
        file,
        is_public: isPublic,
      },
    })
  }

  // 4. Переупорядочивание блоков
  const reorderBlocksMutation = useMutation({
    ...reorderBlocksApiV1CoursesCourseIdLessonsLessonIdBlocksReorderPatchMutation(),
    onMutate: async (variables) => {
      const targetCourseId = variables.path?.course_id || courseId
      const targetLessonId = variables.path?.lesson_id || lessonId
      const queryKey = getBlocksApiV1CoursesCourseIdLessonsLessonIdBlocksGetQueryKey({
        path: { course_id: targetCourseId as string, lesson_id: targetLessonId as string },
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
      showErrorToast(getErrorMessage(err) || "Ошибка при изменении порядка блоков")
    },
    onSuccess: (_, variables) => {
      invalidateBlocksQuery(variables.path?.course_id, variables.path?.lesson_id)
    },
  })

  const reorderBlocksAsync = async (orderedIds: string[]) => {
    if (!isValidParams) throw new Error("Не передан courseId или lessonId")

    return reorderBlocksMutation.mutateAsync({
      path: {
        course_id: courseId as string,
        lesson_id: lessonId as string,
      },
      body: {
        ordered_ids: orderedIds,
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
    reorderBlocksAsync,
    uploadBlockMediaAsync,

    // Raw Mutations & States
    createBlock: createBlockMutation.mutate,
    isCreatingBlock: createBlockMutation.isPending,

    updateBlock: updateBlockMutation.mutate,
    isUpdatingBlock: updateBlockMutation.isPending,

    deleteBlock: deleteBlockMutation.mutate,
    isDeletingBlock: deleteBlockMutation.isPending,

    uploadBlockMedia: uploadBlockMediaMutation.mutate,
    isUploadingBlockMedia: uploadBlockMediaMutation.isPending,

    isReordering: reorderBlocksMutation.isPending,
  }
}