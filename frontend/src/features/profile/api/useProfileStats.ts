import { useQuery } from "@tanstack/react-query";
import { getProfileStatsApiV1UsersMeStatsGetOptions } from "@/client/@tanstack/react-query.gen";
import { isLoggedIn } from "@/features/auth/api/useAuth";

export const useProfileStats = (enabled = true) => {
  return useQuery({
    ...getProfileStatsApiV1UsersMeStatsGetOptions(),
    enabled: enabled && isLoggedIn(),
  });
};