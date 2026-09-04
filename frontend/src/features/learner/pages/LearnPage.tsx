import { useEffect, useState } from "react"
import { notFound, useNavigate, useParams } from "@tanstack/react-router"
import {
  ArrowLeft,
  Award,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Loader2,
  Menu,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { BlockView } from "@/features/learner/components/blocks/BlockView"
import { LearnSidebar } from "@/features/learner/components/LearnSidebar"
import { IrbisDialogue } from "@/features/learner/components/assistant/IrbisDialogue"
import { useLearnData } from "@/features/learner/api/useLearnData"
import { useEnrollCourse } from "@/features/dashboard/api/useCourses"
import { useDownloadCertificate } from "@/features/certificate/api/useDownloadCertificate"
import { ReviewSection } from "@/features/review/components/ReviewSection"
import type { BlockSchema, BlockSubmissionSchema } from "@/client"
import { BlockSubmissionType, BlockType } from "@/client"
import { ASSISTANT_ATTEMPT_THRESHOLD } from "@/lib/assistant"
import { cn } from "@/lib/utils"

export function LearnPage() {
  const { courseId, lessonId } = useParams({ strict: false })
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const data = useLearnData({ courseId, lessonId })
  const { course } = data

  useEffect(() => {
    if (data.isLoading || !course || data.flatUnits.length === 0) return
    if (!lessonId || data.currentIndex < 0) {
      const first = data.flatUnits[0]
      navigate({
        to: "/learn/$courseId/$lessonId",
        params: { courseId: courseId as string, lessonId: first.lesson.id },
        replace: true,
      })
    }
  }, [data.isLoading, course, data.flatUnits, data.currentIndex, lessonId, navigate, courseId])

  const goToLesson = (id: string) => {
    navigate({
      to: "/learn/$courseId/$lessonId",
      params: { courseId: courseId as string, lessonId: id },
    })
  }

  if (data.isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  if (!course) {
    throw notFound()
  }

  return (
    <>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="hidden lg:block lg:sticky lg:top-20 lg:h-[calc(100vh-6rem)] lg:w-72 shrink-0">
          <LearnSidebar
            courseTitle={course?.title ?? ""}
            modules={data.modules}
            lessonsByModule={data.lessonsByModule}
            currentLessonId={lessonId}
            totalLessons={data.flatUnits.length}
            completedCount={data.progress.filter((item) => item.status === "completed").length}
            isCompleted={data.isCompleted}
            onSelectLesson={goToLesson}
            courseId={course?.id ?? undefined}
            tgpEnabled={course?.tgp_enabled ?? false}
            tgpOutdated={course?.tgp_outdated ?? false}
            isMember={data.isCourseMember}
            flatUnits={data.flatUnits}
            widthClassName="w-72"
          />
        </div>

        <div className="min-w-0 flex-1">
          <Button
            variant="outline"
            size="sm"
            className="w-full mb-4 h-9 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-4 w-4 mr-2" />
            Оглавление курса
          </Button>

          <LessonStepper
            data={data}
            courseId={courseId as string}
            lessonId={lessonId as string}
            goToLesson={goToLesson}
          />

          {lessonId && data.isCourseMember && (
            <div className="mt-6">
              <ReviewSection
                targetType="lesson"
                targetId={lessonId}
                title="Комментарии к уроку"
                canWrite
              />
            </div>
          )}
        </div>
      </div>

      {/* Оглавление курса — мобильная шторка */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 w-[85%] sm:max-w-sm overflow-hidden">
          <SheetHeader className="px-4 py-3.5 border-b border-border">
            <SheetTitle className="text-sm">{course?.title ?? "Курс"}</SheetTitle>
          </SheetHeader>
          <div className="flex-1 min-h-0 p-3">
            <LearnSidebar
              fill
              courseTitle={course?.title ?? ""}
              modules={data.modules}
              lessonsByModule={data.lessonsByModule}
              currentLessonId={lessonId}
              totalLessons={data.flatUnits.length}
              completedCount={data.progress.filter((item) => item.status === "completed").length}
              isCompleted={data.isCompleted}
              onSelectLesson={(id) => {
                setSidebarOpen(false)
                goToLesson(id)
              }}
              courseId={course?.id ?? undefined}
              tgpEnabled={course?.tgp_enabled ?? false}
              tgpOutdated={course?.tgp_outdated ?? false}
              isMember={data.isCourseMember}
              flatUnits={data.flatUnits}
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}

interface LessonStepperProps {
  data: ReturnType<typeof useLearnData>
  courseId: string
  lessonId: string
  goToLesson: (id: string) => void
}

function LessonStepper({ data, courseId, lessonId, goToLesson }: LessonStepperProps) {
  const navigate = useNavigate()
  const { course, blocks, currentUnit, nextUnit } = data
  const { download, downloadingId } = useDownloadCertificate()

  const [step, setStep] = useState(0)
  const [seededKey, setSeededKey] = useState<string | null>(null)
  const [selected, setSelected] = useState<Record<string, number[]>>({})
  const [codeByBlock, setCodeByBlock] = useState<Record<string, string>>({})
  const [resultsByBlock, setResultsByBlock] = useState<Record<string, BlockSubmissionSchema>>({})
  const [retrying, setRetrying] = useState<Record<string, boolean>>({})
  const [assistantBlockId, setAssistantBlockId] = useState<string | null>(null)
  const [assistantFromOffer, setAssistantFromOffer] = useState(false)

  const totalSteps = blocks.length
  const resumeIndex = data.firstIncompleteIndex >= 0 ? data.firstIncompleteIndex : totalSteps - 1

  const resumeKey =
    totalSteps > 0 && !data.isLoadingSteps
      ? `${lessonId}/${Math.min(resumeIndex, totalSteps - 1)}`
      : null
  if (resumeKey && resumeKey !== seededKey) {
    setSeededKey(resumeKey)
    setStep(Math.min(resumeIndex, totalSteps - 1))
  }

  if (!course) {
    return null
  }

  if (!data.isCourseMember) {
    return <NotMember courseId={course.id} />
  }

  const isRetrying = (blockId: string): boolean => Boolean(retrying[blockId])

  const isDone = (blockId: string): boolean => {
    if (isRetrying(blockId)) return false
    const local = resultsByBlock[blockId]?.submission_type
    return (
      data.isBlockCompleted(blockId) ||
      local === BlockSubmissionType.CORRECT ||
      local === BlockSubmissionType.COMPLETED
    )
  }

  const lastIncomplete = blocks.findIndex((block) => !isDone(block.id))
  const allStepsDone = totalSteps > 0 && lastIncomplete === -1

  const currentBlock = blocks[Math.min(step, totalSteps - 1)]
  const assistantBlock = blocks.find((block) => block.id === assistantBlockId)
  const isQuiz =
    currentBlock?.block_type === BlockType.QUIZ_SINGLE_CHOICE ||
    currentBlock?.block_type === BlockType.QUIZ_MULTIPLE_CHOICE
  const isCode = currentBlock?.block_type === BlockType.CODE
  const starterCode =
    isCode && currentBlock && typeof currentBlock.payload?.code === "string"
      ? currentBlock.payload.code
      : ""
  const codeValue =
    isCode && currentBlock ? (codeByBlock[currentBlock.id] ?? starterCode) : ""
  const isStepDone = currentBlock ? isDone(currentBlock.id) : false
  const stepResult = currentBlock
    ? isRetrying(currentBlock.id)
      ? resultsByBlock[currentBlock.id]?.submission_type
      : (resultsByBlock[currentBlock.id]?.submission_type ??
        data.submissionsByBlock.get(currentBlock.id)?.submission_type)
    : undefined
  const isLessonCompleted = data.isCompleted(lessonId) || allStepsDone
  const completedFooter = isLessonCompleted && !(currentBlock && isRetrying(currentBlock.id))
  const allLessonsCompleted =
    data.flatUnits.length > 0 &&
    data.progress.filter((item) => item.status === "completed").length ===
      data.flatUnits.length
  const canDownloadCertificate = allLessonsCompleted && course.certificate_enabled
  const quizNeedsAnswer =
    isQuiz && !isStepDone && (currentBlock ? (selected[currentBlock.id]?.length ?? 0) === 0 : false)
  const codeNeedsAnswer = isCode && !isStepDone && codeValue.trim() === ""

  const goToStep = (index: number) => {
    setStep(index)
    setRetrying({})
    setAssistantBlockId(null)
  }

  const goNext = () => goToStep(Math.min(step + 1, totalSteps - 1))

  const submitStep = (payload: Record<string, unknown>) => {
    if (!currentBlock) return
    data.submitBlock.mutate(
      {
        path: { course_id: courseId, lesson_id: lessonId, block_id: currentBlock.id },
        body: { block_id: currentBlock.id, block_type: currentBlock.block_type, payload },
      },
      {
        onSuccess: (submission) => {
          setResultsByBlock((prev) => ({ ...prev, [currentBlock.id]: submission }))
          if (
            submission.submission_type === BlockSubmissionType.CORRECT ||
            submission.submission_type === BlockSubmissionType.COMPLETED
          ) {
            setRetrying((prev) => {
              const next = { ...prev }
              delete next[currentBlock.id]
              return next
            })
            if (assistantBlockId === currentBlock.id) {
              setAssistantBlockId(null)
            }
            goNext()
          } else if (
            submission.submission_type === BlockSubmissionType.WRONG &&
            submission.attempts >= ASSISTANT_ATTEMPT_THRESHOLD &&
            assistantBlockId !== currentBlock.id
          ) {
            setAssistantBlockId(currentBlock.id)
            setAssistantFromOffer(true)
          }
        },
      },
    )
  }

  const handleCheck = () => {
    if (!currentBlock) return
    if (isQuiz) {
      const payload: Record<string, unknown> =
        currentBlock.block_type === BlockType.QUIZ_MULTIPLE_CHOICE
          ? { selected_option_ids: selected[currentBlock.id] ?? [] }
          : { selected_option_id: (selected[currentBlock.id] ?? [])[0] }
      submitStep(payload)
      return
    }
    if (isCode) {
      submitStep({ code: codeValue })
    }
  }

  const handleNext = () => {
    if (!currentBlock) return
    if (isStepDone) {
      goNext()
      return
    }
    if (isQuiz || isCode) return
    submitStep({})
  }

  const handleRetry = () => {
    if (!currentBlock) return
    if (isQuiz) {
      setSelected((prev) => ({ ...prev, [currentBlock.id]: [] }))
    }
    if (isCode) {
      setCodeByBlock((prev) => ({ ...prev, [currentBlock.id]: starterCode }))
    }
    setResultsByBlock((prev) => {
      const next = { ...prev }
      delete next[currentBlock.id]
      return next
    })
    setRetrying((prev) => ({ ...prev, [currentBlock.id]: true }))
  }

  const isLastBlock = step >= totalSteps - 1
  const primaryLabel = isLastBlock ? (nextUnit ? "Следующий урок" : null) : "Далее"
  const primaryAction = () => {
    if (!currentBlock) return
    if (isLastBlock) {
      if (nextUnit) goToLesson(nextUnit.lesson.id)
      return
    }
    handleNext()
  }

  const moduleLabel = currentUnit
    ? `Модуль ${currentUnit.moduleIndex + 1} · ${currentUnit.moduleTitle}`
    : ""

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <button
            type="button"
            onClick={() =>
              navigate({ to: "/courses/$courseId", params: { courseId: course.id } })
            }
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Назад к курсу
          </button>

          {currentUnit && (
            <p className="mt-2 text-xs font-medium text-muted-foreground">{moduleLabel}</p>
          )}
          <h1 className="mt-1 text-xl sm:text-2xl font-bold text-foreground leading-snug">
            {currentUnit?.lesson.title ?? "Урок"}
          </h1>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {canDownloadCertificate && (
            <Button
              variant="outline"
              size="sm"
              disabled={downloadingId === course.id}
              onClick={() => download(course.id)}
              title="Курс пройден — сертификат доступен"
            >
              {downloadingId === course.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Award className="h-4 w-4" />
              )}
              Сертификат
            </Button>
          )}
          {isLessonCompleted && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1.5 text-xs font-semibold text-success shrink-0">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Урок пройден
            </span>
          )}
        </div>
      </div>

      {totalSteps === 0 ? (
        <Card className="rounded-xl p-8 text-center text-sm text-muted-foreground">
          В этом уроке пока нет материалов.
        </Card>
      ) : (
        <>
          <StepIndicator
            blocks={blocks}
            current={step}
            isDone={isDone}
            onSelect={goToStep}
          />

          <Card className="rounded-xl overflow-hidden">
            {currentBlock && (
              <div className="px-5 py-5 sm:px-6">
                <BlockView
                  block={currentBlock}
                  quizSelected={isQuiz ? (selected[currentBlock.id] ?? []) : []}
                  onQuizSelect={(blockId, ids) =>
                    setSelected((prev) => ({ ...prev, [blockId]: ids }))
                  }
                  quizResult={stepResult}
                  quizLocked={isStepDone}
                  codeValue={isCode ? codeValue : undefined}
                  onCodeChange={(blockId, value) =>
                    setCodeByBlock((prev) => ({ ...prev, [blockId]: value }))
                  }
                  codeResult={stepResult}
                  codeLocked={isStepDone}
                />
              </div>
            )}
          </Card>

          <div className="flex items-center justify-between gap-3">
            {completedFooter ? (
              <p className="flex items-center gap-2 rounded-xl bg-success/10 px-4 py-3 text-sm font-medium text-success">
                <Sparkles className="h-4 w-4" />
                Урок завершён
              </p>
            ) : (
              <span />
            )}
            <div className="flex items-center gap-3">
              {(isQuiz || isCode) && isStepDone && (
                <Button variant="outline" onClick={handleRetry}>
                  Решить снова
                </Button>
              )}
              {(isQuiz || isCode) && !isStepDone ? (
                <>
                  {stepResult === BlockSubmissionType.WRONG && assistantBlockId !== currentBlock.id && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setAssistantBlockId(currentBlock.id)
                        setAssistantFromOffer(false)
                      }}
                    >
                      <Sparkles className="h-4 w-4 mr-1.5" />
                      Подсказка
                    </Button>
                  )}
                  <Button
                    disabled={data.isSubmittingStep || quizNeedsAnswer || codeNeedsAnswer}
                    onClick={handleCheck}
                  >
                    {data.isSubmittingStep && <Loader2 className="h-4 w-4 animate-spin" />}
                    Проверить
                  </Button>
                </>
              ) : primaryLabel ? (
                <Button
                  disabled={data.isSubmittingStep}
                  onClick={primaryAction}
                >
                  {data.isSubmittingStep && <Loader2 className="h-4 w-4 animate-spin" />}
                  {primaryLabel}
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              ) : null}
            </div>
          </div>
        </>
      )}

      {assistantBlock && (
        <IrbisDialogue
          open
          block={assistantBlock}
          courseId={courseId as string}
          lessonId={lessonId as string}
          attempts={
            resultsByBlock[assistantBlock.id]?.attempts ??
            data.submissionsByBlock.get(assistantBlock.id)?.attempts ??
            ASSISTANT_ATTEMPT_THRESHOLD
          }
          initialStage={assistantFromOffer ? "offer" : "focus"}
          currentCode={
            assistantBlock.id === currentBlock?.id && currentBlock.block_type === BlockType.CODE
              ? codeValue
              : undefined
          }
          solved={isDone(assistantBlock.id)}
          onClose={() => setAssistantBlockId(null)}
        />
      )}
    </div>
  )
}

interface StepIndicatorProps {
  blocks: BlockSchema[]
  current: number
  isDone: (blockId: string) => boolean
  onSelect: (index: number) => void
}

function StepIndicator({ blocks, current, isDone, onSelect }: StepIndicatorProps) {
  const total = blocks.length
  return (
    <div className="flex items-center justify-between gap-3">
      <p className="text-xs text-muted-foreground tabular-nums shrink-0">
        Шаг {Math.min(current + 1, total)} из {total}
      </p>
      <div className="flex items-center gap-1.5">
        {blocks.map((block, index) => (
          <StepDot
            key={block.id}
            done={isDone(block.id)}
            active={index === current}
            onClick={() => onSelect(index)}
          />
        ))}
      </div>
    </div>
  )
}

function StepDot({
  done,
  active,
  onClick,
}: {
  done: boolean
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-label="Перейти к шагу"
      onClick={onClick}
      className={cn(
        "h-2 w-2 rounded-full transition-colors cursor-pointer",
        active
          ? "bg-primary w-4 rounded-full"
          : done
            ? "bg-success/80"
            : "bg-muted hover:bg-muted-foreground/50",
      )}
    />
  )
}

function NotMember({ courseId }: { courseId: string }) {
  const enroll = useEnrollCourse()
  return (
    <div className="mx-auto max-w-2xl py-24 text-center space-y-4">
      <BookOpen className="mx-auto h-10 w-10 text-muted-foreground" />
      <p className="text-sm text-foreground">Чтобы проходить уроки, сначала запишитесь на курс.</p>
      <Button
        disabled={enroll.isPending}
        onClick={() => enroll.mutate({ path: { course_id: courseId } })}
      >
        {enroll.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        Записаться на курс
      </Button>
    </div>
  )
}