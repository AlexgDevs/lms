import { useQuery } from "@tanstack/react-query"
import { getUserByIdApiV1UsersUserIdGetOptions } from "@/client/@tanstack/react-query.gen"

export function useUserProfile(userId: string | undefined) {
  return useQuery({
    ...getUserByIdApiV1UsersUserIdGetOptions({
      path: { user_id: userId as string },
    }),
    enabled: Boolean(userId),
  })
}
