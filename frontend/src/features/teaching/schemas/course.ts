import * as z from "zod";

// --- CREATE COURSE SCHEMA (CourseCreateRequestSchema) ---
export const createCourseSchema = z.object({
  title: z
    .string()
    .min(1, { message: "Course title is required" })
    .max(128, { message: "Title cannot exceed 128 characters" }),
  description: z
    .string()
    .max(128, { message: "Description cannot exceed 128 characters" })
    .nullable()
    .optional(),
  price: z
    .number({ message: "Price must be a number" })
    .min(0, { message: "Price cannot be negative" })
    .optional(),
  category_id: z
    .string()
    .uuid({ message: "Invalid category" })
    .nullable()
    .optional(),
});

// --- UPDATE COURSE SCHEMA (CourseUpdateRequestSchema) ---
export const updateCourseSchema = z.object({
  title: z
    .string()
    .min(1, { message: "Course title cannot be empty" })
    .max(128, { message: "Title cannot exceed 128 characters" })
    .optional(),
  description: z
    .string()
    .max(128, { message: "Description cannot exceed 128 characters" })
    .nullable()
    .optional(),
  price: z
    .number({ message: "Price must be a number" })
    .min(0, { message: "Price cannot be negative" })
    .nullable()
    .optional(),
});

// --- TYPES ---
export type CreateCourseFormData = z.infer<typeof createCourseSchema>;
export type UpdateCourseFormData = z.infer<typeof updateCourseSchema>;