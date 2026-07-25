import { createFileRoute } from '@tanstack/react-router'
import { TeachingPage } from '@/pages/TeachingPage'

export const Route = createFileRoute('/_layout/teaching/')({
  component: TeachingPage,
})
