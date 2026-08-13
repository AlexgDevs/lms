import { useRef } from "react"
import { Loader2, Trash2, Upload } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import useAuth from "@/features/auth/api/useAuth"
import { useMedia } from "@/features/media/api/useMedia"
import { useUpdateProfile } from "@/features/settings/api/useSettings"

export function AvatarSettingsSection() {
    const { user } = useAuth()
    const updateProfile = useUpdateProfile()
    const { uploadMediaAsync, isUploadingMedia } = useMedia()
    const fileInputRef = useRef<HTMLInputElement>(null)

    const hasAvatar = Boolean(user?.avatar_url)
    const busy = isUploadingMedia || updateProfile.isPending

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        e.target.value = ""
        if (!file) return
        try {
            const media = await uploadMediaAsync(file, true)
            if (media.url) {
                updateProfile.mutate({ body: { avatar_url: media.url } })
            }
        } catch {
            // Toast об ошибке уже показан в useUploadMedia
        }
    }

    const handleRemove = () => {
        updateProfile.mutate({ body: { avatar_url: null } })
    }

    return (
        <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
                <AvatarImage
                    src={user?.avatar_url ?? undefined}
                    alt={user?.username || "Аватар"}
                />
                <AvatarFallback>
                    {user?.username?.[0]?.toUpperCase() || "U"}
                </AvatarFallback>
            </Avatar>
            <div className="space-x-2">
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                />
                <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="rounded-full"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={busy}
                >
                    {isUploadingMedia ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Upload className="w-4 h-4" />
                    )}
                    Загрузить
                </Button>
                {hasAvatar && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleRemove}
                        disabled={busy}
                    >
                        <Trash2 className="w-4 h-4" />
                        Удалить
                    </Button>
                )}
            </div>
        </div>
    )
}
