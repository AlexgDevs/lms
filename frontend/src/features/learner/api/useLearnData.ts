import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  getBlocksApiV1CoursesCourseIdLessonsLessonIdBlocksGetOptions,
  getCourseByIdApiV1CoursesCourseIdGetOptions,
  getModulesApiV1CoursesCourseIdModulesGetOptions,
  getLessonsApiV1CoursesCourseIdModulesModuleIdLessonsGetOptions,
  getCourseProgressApiV1CoursesCourseIdProgressGetOptions,
  getCourseProgressApiV1CoursesCourseIdProgressGetQueryKey,
  getLessonSubmissionsApiV1CoursesCourseIdLessonsLessonIdSubmissionsGetOptions,
  getLessonSubmissionsApiV1CoursesCourseIdLessonsLessonIdSubmissionsGetQueryKey,
  submitBlockApiV1CoursesCourseIdLessonsLessonIdBlocksBlockIdSubmissionPostMutation,
} from "@/client/@tanstack/react-query.gen"
import type {
  BlockSchema,
  BlockSubmissionSchema,
  LessonProgressSchema,
  LessonSchema,
  ModuleSchema,
} from "@/client"
import { BlockSubmissionType } from "@/client"
import { showErrorToast } from "@/lib/toast"
import { getErrorMessage } from "@/lib/errors"

export interface FlatLearningUnit {
  module: ModuleSchema
  moduleIndex: number
  moduleTitle: string
  lesson: LessonSchema
  lessonIndex: number
}

export interface UseLearnDataParams {
  courseId?: string
  lessonId?: string
}

export function useLearnData({ courseId, lessonId }: UseLearnDataParams) {
  const queryClient = useQueryClient()
  const enabled = Boolean(courseId)

  const courseQuery = useQuery({
    ...getCourseByIdApiV1CoursesCourseIdGetOptions({
      path: { course_id: courseId as string },
      query: { filter: "current" },
    }),
    enabled,
  })

  const modulesQuery = useQuery({
    ...getModulesApiV1CoursesCourseIdModulesGetOptions({
      path: { course_id: courseId as string },
      query: { limit: 100, offset: 0 },
    }),
    enabled,
  })

  const modules = (modulesQuery.data ?? []) as ModuleSchema[]

  const lessonsQueries = useQueries({
    queries: modules.map((module) => ({
      ...getLessonsApiV1CoursesCourseIdModulesModuleIdLessonsGetOptions({
        path: { course_id: courseId as string, module_id: module.id },
        query: { limit: 100, offset: 0 },
      }),
      enabled,
    })),
  })

  const lessonsByModule = new Map<string, LessonSchema[]>()
  modules.forEach((module, index) => {
    lessonsByModule.set(module.id, (lessonsQueries[index]?.data ?? []) as LessonSchema[])
  })

  const flatUnits: FlatLearningUnit[] = []
  modules.forEach((module, moduleIndex) => {
    const lessons = lessonsByModule.get(module.id) ?? []
    lessons.forEach((lesson, lessonIndex) => {
      flatUnits.push({ module, moduleIndex, moduleTitle: module.title, lesson, lessonIndex })
    })
  })

  const currentIndex = flatUnits.findIndex((unit) => unit.lesson.id === lessonId)

  const isCourseMember = Boolean(courseQuery.data?.is_member)

  const blocksQuery = useQuery({
    ...getBlocksApiV1CoursesCourseIdLessonsLessonIdBlocksGetOptions({
      path: { course_id: courseId as string, lesson_id: lessonId as string },
      query: { only_created: false },
    }),
    enabled: Boolean(courseId && lessonId && isCourseMember),
  })

  const blocks = (blocksQuery.data ?? []) as BlockSchema[]

  const submissionsQuery = useQuery({
    ...getLessonSubmissionsApiV1CoursesCourseIdLessonsLessonIdSubmissionsGetOptions({
      path: { course_id: courseId as string, lesson_id: lessonId as string },
    }),
    enabled: Boolean(courseId && lessonId && isCourseMember),
  })

  const submissions = (submissionsQuery.data ?? []) as BlockSubmissionSchema[]
  const submissionsByBlock = new Map<string, BlockSubmissionSchema>()
  for (const submission of submissions) {
    submissionsByBlock.set(submission.block_id, submission)
  }

  const progressQuery = useQuery({
    ...getCourseProgressApiV1CoursesCourseIdProgressGetOptions({
      path: { course_id: courseId as string },
    }),
    enabled: Boolean(courseId && isCourseMember),
  })

  const progress = (progressQuery.data ?? []) as LessonProgressSchema[]
  const progressByLesson = new Map<string, LessonProgressSchema>()
  for (const item of progress) {
    progressByLesson.set(item.lesson_id, item)
  }

  const isCompleted = (unitLessonId: string): boolean =>
    progressByLesson.get(unitLessonId)?.status === "completed"

  const isBlockCompleted = (blockId: string): boolean => {
    const submission = submissionsByBlock.get(blockId)
    return (
      submission?.submission_type === BlockSubmissionType.CORRECT ||
      submission?.submission_type === BlockSubmissionType.COMPLETED
    )
  }

  const firstIncompleteIndex = blocks.findIndex((block) => !isBlockCompleted(block.id))

  const submitBlock = useMutation({
    ...submitBlockApiV1CoursesCourseIdLessonsLessonIdBlocksBlockIdSubmissionPostMutation(),
    onSuccess: (_, variables) => {
      const { course_id, lesson_id } = variables.path ?? {}
      if (course_id) {
        queryClient.invalidateQueries({
          queryKey: getCourseProgressApiV1CoursesCourseIdProgressGetQueryKey({
            path: { course_id },
          }),
        })
      }
      if (course_id && lesson_id) {
        queryClient.invalidateQueries({
          queryKey: getLessonSubmissionsApiV1CoursesCourseIdLessonsLessonIdSubmissionsGetQueryKey(
            { path: { course_id, lesson_id } },
          ),
        })
      }
    },
    onError: (err) => {
      showErrorToast(getErrorMessage(err) || "Ошибка при отправке ответа")
    },
  })

  const isLoading =
    courseQuery.isLoading ||
    modulesQuery.isLoading ||
    lessonsQueries.some((query) => query.isLoading && query.fetchStatus !== "idle")

  const isLoadingSteps = courseId && lessonId && isCourseMember
    ? blocksQuery.isLoading || submissionsQuery.isLoading
    : false

  return {
    course: courseQuery.data,
    courseId,
    isCourseMember,
    modules,
    lessonsByModule,
    flatUnits,
    currentIndex,
    currentUnit: currentIndex >= 0 ? flatUnits[currentIndex] : undefined,
    prevUnit: currentIndex > 0 ? flatUnits[currentIndex - 1] : undefined,
    nextUnit:
      currentIndex >= 0 && currentIndex < flatUnits.length - 1
        ? flatUnits[currentIndex + 1]
        : undefined,
    blocks,
    isLoading,
    isLoadingSteps,
    isError: courseQuery.isError || modulesQuery.isError,
    progress,
    progressByLesson,
    isCompleted,
    submissions,
    submissionsByBlock,
    isBlockCompleted,
    firstIncompleteIndex,
    submitBlock,
    isSubmittingStep: submitBlock.isPending,
  }
}