import { Controller, useForm } from "react-hook-form"
import { useNavigate } from "@tanstack/react-router"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Plus, Sparkles } from "lucide-react"

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
import { createCourseSchema, type CreateCourseFormData } from "@/schemas/course"
import { useCourses } from "@/hooks/useCourses"
import { ROUTES } from "@/routes"

interface CreateCourseFormProps {
  onCancel?: () => void
}

export function CreateCourseForm({ onCancel }: CreateCourseFormProps) {
  const navigate = useNavigate()
  const { createCourseMutation } = useCourses()

  const form = useForm<CreateCourseFormData>({
    resolver: zodResolver(createCourseSchema),
    mode: "onBlur",
    defaultValues: {
      title: "",
      description: "",
      price: 0,
    },
  })

  const onSubmit = (data: CreateCourseFormData) => {
    if (createCourseMutation.isPending) return

    createCourseMutation.mutate(
      { body: data },
      {
        onSuccess: (newCourse) => {
          // Мгновенный редирект в конструктор курса по полученному id
          navigate({
            to: `${ROUTES.TEACHING_COURSE}/$courseId`,
            params: { courseId: String(newCourse.id) },
          })
        },
      }
    )
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
                      onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                    />
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
                    disabled={createCourseMutation.isPending}
                  >
                    Отмена
                  </Button>
                )}
                <Button type="submit" disabled={createCourseMutation.isPending}>
                  {createCourseMutation.isPending ? (
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