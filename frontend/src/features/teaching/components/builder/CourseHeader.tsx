import { useState, useEffect, useRef } from "react"
import dayjs from "dayjs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  BookOpen,
  Calendar,
  Globe,
  Lock,
  Loader2,
  Upload,
  Coins,
  Check,
  X,
  Pencil,
  Settings2,
  Folder,
  Clock3,
  AlertTriangle,
} from "lucide-react"
import { resolveMediaUrl } from "@/lib/media"
import { CategoryPicker } from "@/features/teaching/components/CategoryPicker"

type CourseStatus = "draft" | "under_review" | "published" | "rejected"

const STATUS_META: Record<
  CourseStatus,
  { label: string; icon: typeof Globe; className: string }
> = {
  draft: { label: "Черновик", icon: Lock, className: "bg-reward/10 text-reward" },
  under_review: {
    label: "На модерации",
    icon: Clock3,
    className: "bg-primary/10 text-primary",
  },
  published: {
    label: "Опубликован",
    icon: Globe,
    className: "bg-success/10 text-success",
  },
  rejected: {
    label: "Отклонено",
    icon: AlertTriangle,
    className: "bg-destructive/10 text-destructive",
  },
}

interface CourseHeaderProps {
  course: {
    id: string
    title: string
    description?: string | null
    price?: number | null
    cover_url?: string | null
    status?: CourseStatus
    moderation_reason?: string | null
    category_id?: string | null
    created_at?: string
  }
  onUpdateCourse: (data: {
    title?: string
    description?: string | null
    price?: number | null
    status?: "draft"
    category_id?: string | null
  }) => void
  isUpdating?: boolean
  onSubmitReview?: () => void
  isSubmittingReview?: boolean
  onUploadCover?: (file: File) => void
  onRemoveCover?: () => void
  isUploadingCover?: boolean
}

export function CourseHeader({
  course,
  onUpdateCourse,
  isUpdating = false,
  onSubmitReview,
  isSubmittingReview = false,
  onUploadCover,
  onRemoveCover,
  isUploadingCover = false,
}: CourseHeaderProps) {
  const [title, setTitle] = useState(course.title)
  const [description, setDescription] = useState(course.description || "")
  const [price, setPrice] = useState<number | "">(course.price ?? 0)
  const [isFree, setIsFree] = useState((course.price ?? 0) === 0)
  const [categoryId, setCategoryId] = useState<string | null>(course.category_id ?? null)

  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [savedField, setSavedField] = useState<string | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [courseSnapshot, setCourseSnapshot] = useState(course)

  const status: CourseStatus = course.status ?? "draft"
  const StatusIcon = STATUS_META[status].icon

  const titleInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)

  if (course !== courseSnapshot) {
    setCourseSnapshot(course)
    setTitle(course.title)
    setDescription(course.description || "")
    setPrice(course.price ?? 0)
    setIsFree((course.price ?? 0) === 0)
    setCategoryId(course.category_id ?? null)
  }

  useEffect(() => {
    if (isEditingTitle) titleInputRef.current?.focus()
  }, [isEditingTitle])

  const triggerSavedAnimation = (fieldName: string) => {
    setSavedField(fieldName)
    setTimeout(() => setSavedField(null), 2000)
  }

  // --- Название ---
  const handleSaveTitle = () => {
    const trimmed = title.trim()
    if (trimmed && trimmed !== course.title) {
      onUpdateCourse({ title: trimmed })
      triggerSavedAnimation("title")
    } else {
      setTitle(course.title)
    }
    setIsEditingTitle(false)
  }

  const handleCancelTitle = () => {
    setTitle(course.title)
    setIsEditingTitle(false)
  }

  // --- Описание ---
  const handleSaveDescription = () => {
    const trimmed = description.trim()
    if (trimmed !== (course.description || "")) {
      onUpdateCourse({ description: trimmed || null })
      triggerSavedAnimation("description")
    } else {
      setDescription(course.description || "")
    }
  }

  const handleCancelDescription = () => {
    setDescription(course.description || "")
  }

  // --- Цена ---
  const handleSavePrice = () => {
    const numericPrice = isFree ? 0 : Number(price)
    if (numericPrice !== (course.price ?? 0)) {
      onUpdateCourse({ price: numericPrice })
      triggerSavedAnimation("price")
    }
  }

  const handleCancelPrice = () => {
    setPrice(course.price ?? 0)
    setIsFree((course.price ?? 0) === 0)
  }

  const handleFreeToggle = (checked: boolean) => {
    setIsFree(checked)
    if (checked) setPrice(0)
  }

  // --- Категория ---
  const handleSelectCategory = (id: string | null) => {
    setCategoryId(id)
    if (id !== (course.category_id ?? null)) {
      onUpdateCourse({ category_id: id })
      triggerSavedAnimation("category")
    }
  }

  const handleTogglePublish = () => {
    onUpdateCourse({
      status: "draft",
    })
  }

  const descriptionChanged = description.trim() !== (course.description || "")
  const priceChanged = (isFree ? 0 : Number(price)) !== (course.price ?? 0)
  const settingsDirty = descriptionChanged || priceChanged

  return (
    <>
      <div className="rounded-xl bg-card shadow-[var(--shadow-card)] px-4 py-3 flex items-center gap-3">
      {/* Миниатюра обложки — вместо большого баннера, кликабельный триггер загрузки */}
      <div className="relative shrink-0">
        <button
          type="button"
          className="relative w-11 h-11 rounded-md bg-muted/30 overflow-hidden flex items-center justify-center group"
          title="Изменить обложку"
          onClick={() => coverInputRef.current?.click()}
          disabled={isUploadingCover}
        >
          {course.cover_url ? (
            <img
              src={resolveMediaUrl(course.cover_url)}
              alt={course.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <BookOpen size={18} className="text-muted-foreground/40" strokeWidth={1.5} />
          )}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            {isUploadingCover ? (
              <Loader2 size={14} className="text-white animate-spin" />
            ) : (
              <Upload size={14} className="text-white" />
            )}
          </div>
        </button>

        {course.cover_url && onRemoveCover && (
          <button
            type="button"
            className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-background text-muted-foreground hover:text-destructive flex items-center justify-center shadow-sm"
            title="Удалить обложку"
            disabled={isUploadingCover}
            onClick={onRemoveCover}
          >
            <X size={10} />
          </button>
        )}

        <input
          ref={coverInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            e.target.value = ""
            if (file) onUploadCover?.(file)
          }}
        />
      </div>

      {/* Название + статус */}
      <div className="flex-1 min-w-0">
        {isEditingTitle ? (
          <div className="flex items-center gap-1.5">
            <Input
              ref={titleInputRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveTitle()
                if (e.key === "Escape") handleCancelTitle()
              }}
              onBlur={handleSaveTitle}
              className="h-8 font-medium text-[15px] rounded-md bg-muted/20"
            />
            <Button
              type="button"
              size="icon"
              variant="default"
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleSaveTitle}
              className="h-8 w-8 shrink-0 rounded-md"
              title="Сохранить"
            >
              <Check size={14} />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleCancelTitle}
              className="h-8 w-8 shrink-0 rounded-md text-muted-foreground"
              title="Отмена"
            >
              <X size={14} />
            </Button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsEditingTitle(true)}
            className="flex items-center gap-1.5 group max-w-full"
          >
            <span className="font-medium text-[15px] text-foreground truncate">
              {course.title}
            </span>
            <Pencil size={12} className="text-muted-foreground/50 shrink-0 group-hover:text-muted-foreground transition-colors" />
            {savedField === "title" && (
              <Check size={13} className="text-success shrink-0 animate-in fade-in" />
            )}
          </button>
        )}

        <div className="flex items-center gap-2 mt-0.5">
          <Badge
            variant="secondary"
            className={`gap-1 rounded-md px-1.5 py-0 h-4.5 text-[11px] font-normal border-none ${
              STATUS_META[status].className
            }`}
          >
            <StatusIcon size={10} />
            {STATUS_META[status].label}
          </Badge>
          {course.created_at && (
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Calendar size={10} />
              {dayjs(course.created_at).format("DD MMMM YYYY")}
            </span>
          )}
        </div>
      </div>

      {/* Публикация / модерация */}
      {status === "published" ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleTogglePublish}
          disabled={isUpdating}
          className="gap-1.5 text-xs font-medium h-8 shrink-0"
        >
          {isUpdating && <Loader2 size={13} className="animate-spin" />}
          Снять с публикации
        </Button>
      ) : (
        <Button
          type="button"
          variant="default"
          size="sm"
          onClick={onSubmitReview}
          disabled={isSubmittingReview || status === "under_review"}
          className="gap-1.5 text-xs font-medium h-8 shrink-0"
          title={
            status === "under_review"
              ? "Курс уже отправлен на модерацию"
              : "Отправить курс на модерацию"
          }
        >
          {isSubmittingReview && <Loader2 size={13} className="animate-spin" />}
          {status === "under_review"
            ? "На модерации..."
            : status === "rejected"
              ? "Отправить заново"
              : "Отправить на модерацию"}
        </Button>
      )}

      {/* Настройки: описание + цена в попапе, не занимают место в шапке постоянно */}
      <Popover open={settingsOpen} onOpenChange={setSettingsOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="h-8 w-8 shrink-0 rounded-md relative"
            title="Настройки курса"
          >
            <Settings2 size={15} />
            {(course.description || (course.price ?? 0) > 0) && (
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-primary" />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-80 rounded-xl p-4 space-y-4">
          {/* Описание */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="course-desc" className="text-xs font-medium text-muted-foreground">
                Описание
              </Label>
              {savedField === "description" && (
                <span className="text-success text-xs flex items-center gap-1 animate-in fade-in">
                  <Check size={12} /> Сохранено
                </span>
              )}
            </div>
            <Textarea
              id="course-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") handleCancelDescription()
              }}
              placeholder="О чём этот курс..."
              className="text-xs min-h-[72px] resize-none leading-relaxed rounded-md bg-muted/20"
            />
          </div>

          {/* Цена */}
          <div className="space-y-2">
            <Label htmlFor="course-price" className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Coins size={13} className="text-reward" />
              Стоимость (₽)
            </Label>
            <Input
              id="course-price"
              type="number"
              min={0}
              disabled={isFree}
              value={isFree ? 0 : price}
              onChange={(e) =>
                setPrice(e.target.value === "" ? "" : Number(e.target.value))
              }
              placeholder="0"
              className="h-9 font-mono font-semibold rounded-md bg-muted/20"
            />
            <div className="flex items-center space-x-2">
              <Checkbox
                id="free-course"
                checked={isFree}
                onCheckedChange={(checked) => handleFreeToggle(Boolean(checked))}
                className="rounded-md"
              />
              <label
                htmlFor="free-course"
                className="text-xs text-muted-foreground font-medium leading-none cursor-pointer select-none"
              >
                Бесплатный курс
              </label>
            </div>
            {savedField === "price" && (
              <span className="text-success text-xs flex items-center gap-1 animate-in fade-in">
                <Check size={12} /> Сохранено
              </span>
            )}
          </div>

          {/* Категория */}
          <div className="space-y-1.5">
            <Label htmlFor="course-category" className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Folder size={13} className="text-primary" />
              Категория
            </Label>
            <CategoryPicker
              value={categoryId}
              onChange={handleSelectCategory}
              disabled={isUpdating}
            />
            {savedField === "category" && (
              <span className="text-success text-xs flex items-center gap-1 animate-in fade-in">
                <Check size={12} /> Сохранено
              </span>
            )}
          </div>

          {/* Единая панель сохранения для обоих полей попапа */}
          {settingsDirty && (
            <div className="flex items-center gap-2 pt-1">
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  if (descriptionChanged) handleSaveDescription()
                  if (priceChanged) handleSavePrice()
                }}
                className="h-8 flex-1 rounded-full text-xs gap-1.5"
              >
                <Check size={13} /> Сохранить
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  handleCancelDescription()
                  handleCancelPrice()
                }}
                className="h-8 rounded-md text-xs text-muted-foreground"
              >
                Отмена
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>
      </div>

      {(status === "under_review" || status === "rejected") && (
        <div className="mt-2 rounded-xl bg-card shadow-[var(--shadow-card)] px-4 py-2.5 flex items-start gap-2 border">
          <AlertTriangle
            size={14}
            className={`mt-0.5 shrink-0 ${
              status === "rejected" ? "text-destructive" : "text-primary"
            }`}
          />
          <div className="text-xs leading-relaxed text-muted-foreground min-w-0">
            {status === "rejected" ? (
              <>
                <span className="font-medium text-foreground">
                  Курс отклонён модерацией.
                </span>{" "}
                {course.moderation_reason || "Причина не указана."}
              </>
            ) : (
              <>
                <span className="font-medium text-foreground">
                  Курс на модерации.
                </span>{" "}
                {course.moderation_reason
                  ? `Причина проверки: ${course.moderation_reason}`
                  : "Проверка может занять несколько минут."}
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}