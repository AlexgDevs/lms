import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { showErrorToast, showSuccessToast } from "@/lib/toast"
import { getErrorMessage } from "@/lib/errors"
import {
  deleteMediaApiV1MediaMediaIdDeleteMutation,
  getMediaUrlApiV1MediaMediaIdUrlGetOptions,
  getMyMediaApiV1MediaGetQueryKey,
  getMyMediaApiV1MediaGetOptions,
  uploadMediaApiV1MediaPostMutation,
} from "@/client/@tanstack/react-query.gen"
import type { MediaResponseSchema } from "@/client"

export const useMyMedia = (limit = 100, offset = 0) => {
  return useQuery({
    ...getMyMediaApiV1MediaGetOptions({
      query: { limit, offset },
    }),
  })
}

export const useMediaUrl = (mediaId?: string, expiresIn?: number) => {
  return useQuery({
    ...getMediaUrlApiV1MediaMediaIdUrlGetOptions({
      path: { media_id: mediaId as string },
      query: expiresIn !== undefined ? { expires_in: expiresIn } : undefined,
    }),
    enabled: Boolean(mediaId),
  })
}

export const useUploadMedia = () => {
  const queryClient = useQueryClient()

  return useMutation({
    ...uploadMediaApiV1MediaPostMutation(),
    onSuccess: (media) => {
      showSuccessToast("Файл загружен")
      queryClient.invalidateQueries({
        queryKey: getMyMediaApiV1MediaGetQueryKey(),
      })
      queryClient.setQueryData<MediaResponseSchema[]>(
        getMyMediaApiV1MediaGetQueryKey(),
        (old) => (old ? [media, ...old] : old),
      )
    },
    onError: (err) => {
      showErrorToast(getErrorMessage(err) || "Ошибка при загрузке файла")
    },
  })
}

export const useDeleteMedia = () => {
  const queryClient = useQueryClient()

  return useMutation({
    ...deleteMediaApiV1MediaMediaIdDeleteMutation(),
    onSuccess: () => {
      showSuccessToast("Файл удален")
      queryClient.invalidateQueries({
        queryKey: getMyMediaApiV1MediaGetQueryKey(),
      })
    },
    onError: (err) => {
      showErrorToast(getErrorMessage(err) || "Ошибка при удалении файла")
    },
  })
}

export const useMedia = () => {
  const myMedia = useMyMedia()
  const uploadMediaMutation = useUploadMedia()
  const deleteMediaMutation = useDeleteMedia()
  const queryClient = useQueryClient()

  const uploadMediaAsync = (file: File, isPublic = false) =>
    uploadMediaMutation.mutateAsync({
      body: { file, is_public: isPublic },
    })

  const deleteMediaAsync = (mediaId: string) =>
    deleteMediaMutation.mutateAsync({
      path: { media_id: mediaId },
    })

  return {
    media: myMedia.data,
    isLoadingMedia: myMedia.isLoading,
    mediaError: myMedia.error,
    refetchMedia: myMedia.refetch,
    invalidateMedia: () =>
      queryClient.invalidateQueries({ queryKey: getMyMediaApiV1MediaGetQueryKey() }),
    uploadMediaAsync,
    isUploadingMedia: uploadMediaMutation.isPending,
    deleteMediaAsync,
    isDeletingMedia: deleteMediaMutation.isPending,
  }
}
