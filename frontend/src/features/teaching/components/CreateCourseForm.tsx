import { Controller, useForm } from "react-hook-form"
import { useNavigate, Link } from "@tanstack/react-router"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowRight, Loader2, Plus, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectGroupLabel,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createCourseSchema, type CreateCourseFormData } from "@/features/teaching/schemas/course"
import { useCourses } from "@/features/teaching/api/useCourses"
import { useCategoryTree } from "@/features/dashboard/api/useCategories"
import { ROUTES } from "@/routes"

interface CreateCourseFormProps {
  onCancel?: () => void
}

export function CreateCourseForm({ onCancel }: CreateCourseFormProps) {
  const navigate = useNavigate()
  // Достаём те названия, которые реально возвращаются из useCourses
  const { createCourseAsync, isCreatingCourse } = useCourses()
  const { tree } = useCategoryTree()

  const form = useForm<CreateCourseFormData>({
    resolver: zodResolver(createCourseSchema),
    mode: "onBlur",
    defaultValues: {
      title: "",
      description: "",
      price: 0,
      category_id: null,
    },
  })

  const onSubmit = async (data: CreateCourseFormData) => {
    if (isCreatingCourse) return

    try {
      // Вызываем асинхронную мутацию
      const newCourse = await createCourseAsync({ body: data })

      // Мгновенный редирект в конструктор курса по полученному id
      if (newCourse?.id) {
        navigate({
          to: `${ROUTES.TEACHING_COURSE}/$courseId`,
          params: { courseId: String(newCourse.id) },
        })
      }
    } catch {
      // Ошибки подхватываются глобальным toast'ом из хука useCourses
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            Новый курс
          </div>
          <CardTitle className="text-xl font-bold">Создание курса</CardTitle>
          <CardDescription>
            Заполните основные данные. Позже их можно будет отредактировать.
            <Link
              to={ROUTES.TEACHING_GUIDE}
              className="ml-1.5 inline-flex items-center gap-0.5 font-medium text-primary underline-offset-2 hover:underline"
            >
              Как создавать курсы <ArrowRight className="h-3 w-3" />
            </Link>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <FieldGroup>
              
              {/* Название курса */}
              <Controller
                name="title"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>
                      Название курса <span className="text-destructive">*</span>
                    </FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      aria-invalid={fieldState.invalid}
                      type="text"
                      placeholder="Например: FastAPI для профессионалов"
                    />
                    {fieldState.invalid && (
                      <FieldError
                        errors={fieldState.error ? [fieldState.error] : []}
                      />
                    )}
                  </Field>
                )}
              />

              {/* Описание курса */}
              <Controller
                name="description"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>Описание</FieldLabel>
                    <Textarea
                      {...field}
                      value={field.value ?? ""}
                      id={field.name}
                      aria-invalid={fieldState.invalid}
                      rows={3}
                      placeholder="Кратко опишите, чему научит ваш курс..."
                    />
                    {fieldState.invalid && (
                      <FieldError
                        errors={fieldState.error ? [fieldState.error] : []}
                      />
                    )}
                  </Field>
                )}
              />

              {/* Цена курса */}
              <Controller
                name="price"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>Цена (₽)</FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      aria-invalid={fieldState.invalid}
                      type="number"
                      min={0}
                      placeholder="0 для бесплатного курса"
                      onChange={(e) => {
                        const val = e.target.valueAsNumber
                        field.onChange(Number.isNaN(val) ? 0 : val)
                      }}
                    />
                    {fieldState.invalid && (
                      <FieldError
                        errors={fieldState.error ? [fieldState.error] : []}
                      />
                    )}
                  </Field>
                )}
              />

              {/* Категория курса */}
              <Controller
                name="category_id"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>Категория</FieldLabel>
                    <Select
                      value={field.value ?? undefined}
                      onValueChange={(value) => field.onChange(value || null)}
                    >
                      <SelectTrigger id={field.name}>
                        <SelectValue placeholder="Выберите категорию" />
                      </SelectTrigger>
                      <SelectContent>
                        {tree.map((parent) => (
                          <SelectGroup key={parent.id}>
                            <SelectGroupLabel>
                              {parent.name}
                            </SelectGroupLabel>
                            {parent.children.map((child) => (
                              <SelectItem key={child.id} value={child.id}>
                                {child.name}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && (
                      <FieldError
                        errors={fieldState.error ? [fieldState.error] : []}
                      />
                    )}
                  </Field>
                )}
              />

              {/* Кнопки */}
              <div className="flex items-center justify-end gap-3 pt-2">
                {onCancel && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={isCreatingCourse}
                  >
                    Отмена
                  </Button>
                )}
                <Button type="submit" disabled={isCreatingCourse}>
                  {isCreatingCourse ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="mr-2 h-4 w-4" />
                  )}
                  Создать и перейти к конструктору
                </Button>
              </div>

            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}