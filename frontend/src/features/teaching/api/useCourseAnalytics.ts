import { useQuery } from "@tanstack/react-query"

const API_BASE = import.meta.env.VITE_API_URL ?? ""

export interface CourseOverview {
  course_id: string
  total_enrolled: number
  active: number
  churned: number
  completion_rate: number
  avg_accuracy: number
}

export interface EnrollmentTrendDay {
  date: string
  enrolled: number
  unenrolled: number
}

export interface EnrollmentTrend {
  course_id: string
  days: EnrollmentTrendDay[]
}

export interface LessonPerformance {
  lesson_id: string
  title: string
  module_title: string
  completion_rate: number
  avg_time_seconds: number
  total_started: number
  total_completed: number
}

export interface BlockPerformance {
  block_id: string
  title: string
  block_type: string
  lesson_title: string
  accuracy: number
  avg_attempts: number
  first_try_rate: number
  total_submissions: number
}

export interface ContentPerformance {
  course_id: string
  lessons: LessonPerformance[]
  blocks: BlockPerformance[]
}

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("access_token")}`,
})

export const useCourseOverview = (courseId: string | undefined) => {
  return useQuery<CourseOverview>({
    queryKey: ["courseAnalytics", courseId, "overview"],
    queryFn: async () => {
      const res = await fetch(
        `${API_BASE}/api/v1/courses/${courseId}/analytics`,
        { headers: authHeaders() }
      )
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || "Failed to load analytics")
      }
      return res.json()
    },
    enabled: Boolean(courseId),
  })
}

export const useEnrollmentTrend = (
  courseId: string | undefined,
  days = 30
) => {
  return useQuery<EnrollmentTrend>({
    queryKey: ["courseAnalytics", courseId, "enrollments", days],
    queryFn: async () => {
      const res = await fetch(
        `${API_BASE}/api/v1/courses/${courseId}/analytics/enrollments?days=${days}`,
        { headers: authHeaders() }
      )
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || "Failed to load enrollment trend")
      }
      return res.json()
    },
    enabled: Boolean(courseId),
  })
}

export const useContentPerformance = (courseId: string | undefined) => {
  return useQuery<ContentPerformance>({
    queryKey: ["courseAnalytics", courseId, "content"],
    queryFn: async () => {
      const res = await fetch(
        `${API_BASE}/api/v1/courses/${courseId}/analytics/content`,
        { headers: authHeaders() }
      )
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || "Failed to load content performance")
      }
      return res.json()
    },
    enabled: Boolean(courseId),
  })
}
