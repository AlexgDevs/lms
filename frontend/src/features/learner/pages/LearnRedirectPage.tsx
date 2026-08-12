import { useEffect } from "react"
import { useNavigate, useParams } from "@tanstack/react-router"
import { Loader2 } from "lucide-react"
import { useLearnData } from "@/features/learner/api/useLearnData"

export function LearnRedirectPage() {
  const { courseId } = useParams({ strict: false })
  const navigate = useNavigate()
  const data = useLearnData({ courseId })

  useEffect(() => {
    if (data.isLoading || !data.course) return
    const first = data.flatUnits[0]
    if (first) {
      navigate({
        to: "/learn/$courseId/$lessonId",
        params: { courseId: courseId as string, lessonId: first.lesson.id },
        replace: true,
      })
    } else {
      navigate({ to: "/courses/$courseId", params: { courseId: courseId as string }, replace: true })
    }
  }, [data.isLoading, data.course, data.flatUnits, navigate, courseId])

  return (
    <div className="flex items-center justify-center py-24">
      <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
    </div>
  )
}