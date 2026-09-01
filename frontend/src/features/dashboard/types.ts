import type { CourseSchema } from "@/client"

export interface CourseCardData extends CourseSchema {
  progress?: number
}
