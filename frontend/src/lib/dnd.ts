import { useCallback, useRef, useState } from "react"

export function arrayMove<T>(array: T[], from: number, to: number): T[] {
  const copy = [...array]
  const [item] = copy.splice(from, 1)
  copy.splice(to, 0, item)
  return copy
}

export interface ReorderableItem {
  id: string
}

/**
 * Возвращает новый порядок (массив) в том же формате, что и в кэше React Query.
 * Кэш может хранить либо простой массив, либо объект с полем `items`.
 */
export function applyOrderToCache(old: unknown, orderedIds: string[]): unknown {
  const list = Array.isArray(old)
    ? old
    : (old as { items?: unknown[] } | null | undefined)?.items
  if (!Array.isArray(list)) return old

  const next = orderedIds
    .map((id) =>
      list.find((item) => (item as { id?: unknown } | null)?.id === id),
    )
    .filter(Boolean)

  return Array.isArray(old) ? next : { ...(old as object), items: next }
}

interface UseReorderableListResult {
  draggingId: string | null
  overId: string | null
  isDragging: boolean
  beginDrag: (e: React.DragEvent, id: string) => void
  dragOver: (e: React.DragEvent, targetId: string) => void
  drop: (e: React.DragEvent, targetId: string) => void
  dragEnd: () => void
}

export function useReorderableList<T extends ReorderableItem>(
  items: T[],
  onReorder: (orderedIds: string[]) => void,
  disabled = false,
): UseReorderableListResult {
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)
  const draggingIdRef = useRef<string | null>(null)

  const reset = useCallback(() => {
    draggingIdRef.current = null
    setDraggingId(null)
    setOverId(null)
  }, [])

  const beginDrag = useCallback((e: React.DragEvent, id: string) => {
    if (disabled) return
    draggingIdRef.current = id
    setDraggingId(id)
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/plain", id)
  }, [disabled])

  const dragOver = useCallback((e: React.DragEvent, targetId: string) => {
    if (disabled || draggingIdRef.current === null) return
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    if (targetId !== draggingIdRef.current) {
      setOverId(targetId)
    }
  }, [disabled])

  const drop = useCallback((e: React.DragEvent, targetId: string) => {
    if (disabled) return
    e.preventDefault()
    const fromId = draggingIdRef.current || e.dataTransfer.getData("text/plain")
    const fromIndex = items.findIndex((item) => item.id === fromId)
    const toIndex = items.findIndex((item) => item.id === targetId)
    reset()
    if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return
    onReorder(arrayMove(items, fromIndex, toIndex).map((item) => item.id))
  }, [disabled, items, onReorder, reset])

  const dragEnd = useCallback(() => {
    reset()
  }, [reset])

  return {
    draggingId,
    overId,
    isDragging: draggingId !== null,
    beginDrag,
    dragOver,
    drop,
    dragEnd,
  }
}
