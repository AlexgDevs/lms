import { useParams } from "@tanstack/react-router"
import { Loader2, ShieldCheck, Sparkles } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { NotFoundPage } from "@/components/NotFoundPage"
import { ProfileHeader } from "@/features/profile/components/ProfileHeader"
import { useUserProfile } from "@/features/profile/api/useUserProfile"

export function UserProfilePage() {
  const { userId } = useParams({ strict: false })
  const { data: user, isLoading, isError } = useUserProfile(userId)

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (isError || !user) {
    return <NotFoundPage />
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-2">
      <ProfileHeader user={user} />

      {(user.is_staff || user.is_founder) && (
        <div className="flex flex-wrap gap-2">
          {user.is_founder && (
            <Badge className="gap-1 bg-reward text-white border-reward/20">
              <Sparkles className="h-3 w-3" />
              Основатель
            </Badge>
          )}
          {user.is_staff && !user.is_founder && (
            <Badge variant="secondary" className="gap-1">
              <ShieldCheck className="h-3 w-3" />
              Преподаватель
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}
