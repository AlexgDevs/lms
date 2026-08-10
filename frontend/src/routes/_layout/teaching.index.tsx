import { createFileRoute } from '@tanstack/react-router'
import { TeachingPage } from '@/features/teaching/pages/TeachingPage'

export const Route = createFileRoute('/_layout/teaching/')({
  component: TeachingPage,
})
