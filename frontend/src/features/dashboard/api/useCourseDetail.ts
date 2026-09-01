import { useQueries, useQuery } from "@tanstack/react-query";
import {
  getCourseByIdApiV1CoursesCourseIdGetOptions,
  getLessonsApiV1CoursesCourseIdModulesModuleIdLessonsGetOptions,
  getModulesApiV1CoursesCourseIdModulesGetOptions,
} from "@/client/@tanstack/react-query.gen";
import type { LessonSchema, ModuleSchema } from "@/client";

export const useCourseDetail = (courseId?: string) => {
  const enabled = Boolean(courseId);

  const courseQuery = useQuery({
    ...getCourseByIdApiV1CoursesCourseIdGetOptions({
      path: { course_id: courseId as string },
      query: { filter: "current" },
    }),
    enabled,
  });

  const modulesQuery = useQuery({
    ...getModulesApiV1CoursesCourseIdModulesGetOptions({
      path: { course_id: courseId as string },
      query: { limit: 100, offset: 0 },
    }),
    enabled,
  });

  const modules = (modulesQuery.data ?? []) as ModuleSchema[];

  const lessonsQueries = useQueries({
    queries: modules.map((module) => ({
      ...getLessonsApiV1CoursesCourseIdModulesModuleIdLessonsGetOptions({
        path: { course_id: courseId as string, module_id: module.id },
        query: { limit: 100, offset: 0 },
      }),
      enabled,
    })),
  });

  const lessonsByModule = new Map<string, LessonSchema[]>();
  modules.forEach((module, index) => {
    const result = lessonsQueries[index];
    lessonsByModule.set(module.id, (result?.data ?? []) as LessonSchema[]);
  });

  const isLoading =
    courseQuery.isLoading || modulesQuery.isLoading;

  return {
    course: courseQuery.data,
    modules,
    lessonsByModule,
    isLoading,
    isError: courseQuery.isError || modulesQuery.isError,
  };
};
