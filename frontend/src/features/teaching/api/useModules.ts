import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { 
  getModulesApiV1CoursesCourseIdModulesGetOptions,
  getModulesApiV1CoursesCourseIdModulesGetQueryKey,
  createModuleApiV1CoursesCourseIdModulesPostMutation,
  updateModuleApiV1CoursesCourseIdModulesModuleIdPatchMutation,
  deleteModuleApiV1CoursesCourseIdModulesModuleIdDeleteMutation,
  reorderModulesApiV1CoursesCourseIdModulesReorderPatchMutation
} from "@/client/@tanstack/react-query.gen"
import { showErrorToast, showSuccessToast } from "@/lib/toast"
import { getErrorMessage } from "@/lib/errors"
import { applyOrderToCache } from "@/lib/dnd"

interface UseModulesOptions {
  courseId: string
  onlyCreated?: boolean
}

// Регулярка для строгого соответствия UUID v4 / UUID
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function useModules({ courseId, onlyCreated = false }: UseModulesOptions) {
  const queryClient = useQueryClient()

  // Проверяем, что courseId — это действительно валидный UUID, а не плейсхолдер "{course_id}" или "undefined"
  const isValidCourseId = Boolean(courseId) && UUID_REGEX.test(courseId)

  // Хелпер инвалидации кэша модулей
  const invalidateModulesCache = (targetCourseId?: string) => {
    const idToInvalidate = targetCourseId || courseId
    if (!idToInvalidate || !UUID_REGEX.test(idToInvalidate)) return

    queryClient.invalidateQueries({
      queryKey: getModulesApiV1CoursesCourseIdModulesGetQueryKey({
        path: { course_id: idToInvalidate },
      }),
    })
  }

  // 1. Запрос списка модулей
  const { 
    data: modulesData, 
    isLoading: isLoadingModules,
    error: modulesError 
  } = useQuery({
    ...getModulesApiV1CoursesCourseIdModulesGetOptions({
      path: { course_id: courseId },
      query: { only_created: onlyCreated },
    }),
    // Запрос выполнится ТОЛЬКО если courseId является корректным UUID
    enabled: isValidCourseId,
  })

  const modules = Array.isArray(modulesData) 
    ? modulesData 
    : (modulesData as any)?.items || []

  // 2. Создание модуля
  const createModuleMutation = useMutation({
    ...createModuleApiV1CoursesCourseIdModulesPostMutation(),
    onSuccess: (_, variables) => {
      showSuccessToast("Модуль успешно создан")
      invalidateModulesCache(variables.path?.course_id)
    },
    onError: (err) => {
      showErrorToast(getErrorMessage(err) || "Ошибка при создании модуля")
    }
  })

  // 3. Обновление модуля
  const updateModuleMutation = useMutation({
    ...updateModuleApiV1CoursesCourseIdModulesModuleIdPatchMutation(),
    onSuccess: (_, variables) => {
      showSuccessToast("Модуль успешно обновлен")
      invalidateModulesCache(variables.path?.course_id)
    },
    onError: (err) => {
      showErrorToast(getErrorMessage(err) || "Ошибка при обновлении модуля")
    }
  })

  // 4. Удаление модуля
  const deleteModuleMutation = useMutation({
    ...deleteModuleApiV1CoursesCourseIdModulesModuleIdDeleteMutation(),
    onSuccess: (_, variables) => {
      showSuccessToast("Модуль успешно удален")
      invalidateModulesCache(variables.path?.course_id)
    },
    onError: (err) => {
      showErrorToast(getErrorMessage(err) || "Ошибка при удалении модуля")
    }
  })

  // Удобные хелперы для вызова с чистым интерфейсом
  const createModuleAsync = async (body: { title: string; description?: string }) => {
    if (!isValidCourseId) {
      throw new Error("Нельзя создать модуль: невалидный courseId")
    }
    return createModuleMutation.mutateAsync({
      path: { course_id: courseId },
      body,
    })
  }

  const updateModuleAsync = async (moduleId: string, body: { title?: string; description?: string }) => {
    if (!isValidCourseId || !UUID_REGEX.test(moduleId)) {
      throw new Error("Нельзя обновить модуль: невалидный courseId или moduleId")
    }
    return updateModuleMutation.mutateAsync({
      path: { course_id: courseId, module_id: moduleId },
      body,
    })
  }

  const deleteModuleAsync = async (moduleId: string) => {
    if (!isValidCourseId || !UUID_REGEX.test(moduleId)) {
      throw new Error("Нельзя удалить модуль: невалидный courseId или moduleId")
    }
    return deleteModuleMutation.mutateAsync({
      path: { course_id: courseId, module_id: moduleId },
    })
  }

  // 5. Переупорядочивание модулей
  const reorderModulesMutation = useMutation({
    ...reorderModulesApiV1CoursesCourseIdModulesReorderPatchMutation(),
    onMutate: async (variables) => {
      const queryKey = getModulesApiV1CoursesCourseIdModulesGetQueryKey({
        path: { course_id: variables.path.course_id },
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
      showErrorToast(getErrorMessage(err) || "Ошибка при изменении порядка модулей")
    },
    onSuccess: (_, variables) => {
      invalidateModulesCache(variables.path?.course_id)
    },
  })

  const reorderModulesAsync = async (orderedIds: string[]) => {
    if (!isValidCourseId) {
      throw new Error("Нельзя изменить порядок: невалидный courseId")
    }
    return reorderModulesMutation.mutateAsync({
      path: { course_id: courseId },
      body: { ordered_ids: orderedIds },
    })
  }

  return {
    modules,
    isLoadingModules,
    modulesError,

    // Raw mutations
    createModuleMutation,
    updateModuleMutation,
    deleteModuleMutation,
    reorderModulesMutation,

    // Чистые обертки
    createModuleAsync,
    updateModuleAsync,
    deleteModuleAsync,
    reorderModulesAsync,

    isCreating: createModuleMutation.isPending,
    isUpdating: updateModuleMutation.isPending,
    isDeleting: deleteModuleMutation.isPending,
    isReordering: reorderModulesMutation.isPending,
  }
}