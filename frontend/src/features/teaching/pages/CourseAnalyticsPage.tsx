import { useParams } from "@tanstack/react-router"
import { ArrowLeft, Loader2 } from "lucide-react"
import { useNavigate } from "@tanstack/react-router"
import { Card } from "@/components/ui/card"
import { OverviewCards } from "@/features/teaching/components/analytics/OverviewCards"
import { EnrollmentChart } from "@/features/teaching/components/analytics/EnrollmentChart"
import { LessonsTable } from "@/features/teaching/components/analytics/LessonsTable"
import { BlocksTable } from "@/features/teaching/components/analytics/BlocksTable"
import {
  useCourseOverview,
  useEnrollmentTrend,
  useContentPerformance,
} from "@/features/teaching/api/useCourseAnalytics"
import { ROUTES } from "@/routes"

export function CourseAnalyticsPage() {
  const { courseId } = useParams({ strict: false }) as { courseId: string }
  const navigate = useNavigate()

  const overview = useCourseOverview(courseId)
  const trend = useEnrollmentTrend(courseId)
  const content = useContentPerformance(courseId)

  const isLoading = overview.isLoading || trend.isLoading || content.isLoading

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    )
  }

  const overviewData = overview.data
  const trendData = trend.data
  const contentData = content.data

  return (
    <div className="max-w-6xl mx-auto space-y-6 py-6 px-4 sm:px-6">
      <button
        type="button"
        onClick={() => navigate({ to: ROUTES.TEACHING })}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Назад к преподаванию
      </button>

      <h1 className="text-xl font-bold text-foreground">Аналитика курса</h1>

      {overviewData && (
        <OverviewCards
          totalEnrolled={overviewData.total_enrolled}
          active={overviewData.active}
          churned={overviewData.churned}
          completionRate={overviewData.completion_rate}
          avgAccuracy={overviewData.avg_accuracy}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {trendData && <EnrollmentChart data={trendData.days} />}

        <Card className="rounded-xl p-6">
          <h3 className="text-sm font-bold mb-4">Сводка</h3>
          {overviewData && (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Записано студентов</span>
                <span className="font-semibold">
                  {overviewData.total_enrolled}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Отписались</span>
                <span className="font-semibold text-destructive">
                  {overviewData.churned}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Процент завершения
                </span>
                <span className="font-semibold">
                  {overviewData.completion_rate}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Средняя точность</span>
                <span className="font-semibold">
                  {overviewData.avg_accuracy}%
                </span>
              </div>
            </div>
          )}
        </Card>
      </div>

      {contentData && (
        <>
          <LessonsTable lessons={contentData.lessons} />
          <BlocksTable blocks={contentData.blocks} />
        </>
      )}
    </div>
  )
}
