import { useEffect } from "react"
import { useNavigate, useParams } from "@tanstack/react-router"
import { BookOpen, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useLearnData } from "@/features/learner/api/useLearnData"
import { ROUTES } from "@/routes"

export function LearnRedirectPage() {
  const { courseId } = useParams({ strict: false })
  const navigate = useNavigate()
  const data = useLearnData({ courseId })

  useEffect(() => {
    if (data.isLoading || !data.course || data.flatUnits.length === 0) return
    const first = data.flatUnits[0]
    navigate({
      to: "/learn/$courseId/$lessonId",
      params: { courseId: courseId as string, lessonId: first.lesson.id },
      replace: true,
    })
  }, [data.isLoading, data.course, data.flatUnits, navigate, courseId])

  if (data.isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  if (!data.course) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4 text-center">
        <BookOpen className="w-10 h-10 text-muted-foreground" />
        <div>
          <p className="font-semibold text-foreground">Курс не найден</p>
          <p className="text-sm text-muted-foreground mt-1">
            Курс мог быть удалён или ещё не опубликован.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate({ to: ROUTES.CATALOG })}
        >
          Вернуться в каталог
        </Button>
      </div>
    )
  }

  if (data.flatUnits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4 text-center">
        <BookOpen className="w-10 h-10 text-muted-foreground" />
        <div>
          <p className="font-semibold text-foreground">В этом курсе пока нет уроков</p>
          <p className="text-sm text-muted-foreground mt-1">
            Автор ещё не добавил материалы. Загляните позже.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            navigate({
              to: "/courses/$courseId",
              params: { courseId: courseId as string },
            })
          }
        >
          Вернуться к курсу
        </Button>
      </div>
    )
  }

  return null
}
