import { useQuery } from "@tanstack/react-query";
import { listMyCertificatesApiV1UsersMeCertificatesGetOptions } from "@/client/@tanstack/react-query.gen";
import { isLoggedIn } from "@/features/auth/api/useAuth";

export const useMyCertificates = (enabled = true) => {
  return useQuery({
    ...listMyCertificatesApiV1UsersMeCertificatesGetOptions(),
    enabled: enabled && isLoggedIn(),
  });
};
