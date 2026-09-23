import { useQuery } from "@tanstack/react-query"
import { getFounderProgressEndpointApiV1FounderProgressGetOptions } from "@/client/@tanstack/react-query.gen"

export function useFounderProgress() {
  return useQuery({
    ...getFounderProgressEndpointApiV1FounderProgressGetOptions(),
    refetchInterval: 60_000,
  })
}
