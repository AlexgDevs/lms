import * as z from "zod";

// Business limits (mirror backend core/schemas/limits.py).
// Price on the frontend is in RUBLES; the backend stores kopeks.
export const COURSE_TITLE_MIN = 1;
export const COURSE_TITLE_MAX = 128;
export const COURSE_DESCRIPTION_MAX = 300;
export const COURSE_PRICE_MIN_PAID_RUB = 50;
export const COURSE_PRICE_MAX_RUB = 100_000;

const priceMessage =
  "Цена должна быть 0 (бесплатно) или от 50 до 100 000 ₽";

// --- CREATE COURSE SCHEMA (CourseCreateRequestSchema) ---
export const createCourseSchema = z.object({
  title: z
    .string()
    .min(COURSE_TITLE_MIN, { message: "Название курса обязательно" })
    .max(COURSE_TITLE_MAX, {
      message: `Название не должно превышать ${COURSE_TITLE_MAX} символов`,
    }),
  description: z
    .string()
    .max(COURSE_DESCRIPTION_MAX, {
      message: `Описание не должно превышать ${COURSE_DESCRIPTION_MAX} символов`,
    })
    .nullable()
    .optional(),
  price: z
    .number({ message: "Цена должна быть числом" })
    .refine(
      (v) =>
        v === 0 ||
        (v >= COURSE_PRICE_MIN_PAID_RUB && v <= COURSE_PRICE_MAX_RUB),
      { message: priceMessage },
    )
    .optional(),
  category_id: z
    .string()
    .uuid({ message: "Некорректная категория" })
    .nullable()
    .optional(),
});

// --- UPDATE COURSE SCHEMA (CourseUpdateRequestSchema) ---
export const updateCourseSchema = z.object({
  title: z
    .string()
    .min(COURSE_TITLE_MIN, { message: "Название курса не может быть пустым" })
    .max(COURSE_TITLE_MAX, {
      message: `Название не должно превышать ${COURSE_TITLE_MAX} символов`,
    })
    .optional(),
  description: z
    .string()
    .max(COURSE_DESCRIPTION_MAX, {
      message: `Описание не должно превышать ${COURSE_DESCRIPTION_MAX} символов`,
    })
    .nullable()
    .optional(),
  price: z
    .number({ message: "Цена должна быть числом" })
    .refine(
      (v) =>
        v === 0 ||
        (v >= COURSE_PRICE_MIN_PAID_RUB && v <= COURSE_PRICE_MAX_RUB),
      { message: priceMessage },
    )
    .nullable()
    .optional(),
});

// --- TYPES ---
export type CreateCourseFormData = z.infer<typeof createCourseSchema>;
export type UpdateCourseFormData = z.infer<typeof updateCourseSchema>;
