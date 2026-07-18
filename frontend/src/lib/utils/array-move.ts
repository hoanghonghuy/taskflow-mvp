/**
 * Move an item from `from` to `to` (same semantics as @dnd-kit arrayMove).
 * Uses the original `to` index after removal — do NOT subtract 1 when dragging down.
 */
export function arrayMove<T>(items: T[], from: number, to: number): T[] {
  if (from === to) return items
  if (from < 0 || to < 0 || from >= items.length || to >= items.length) return items

  const next = items.slice()
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

/** Reorder by id: place `draggedId` at the index of `droppedOnId`. */
export function moveItemById<T extends { id: string }>(
  items: T[],
  draggedId: string,
  droppedOnId: string,
): T[] {
  if (draggedId === droppedOnId) return items
  const from = items.findIndex((item) => item.id === draggedId)
  const to = items.findIndex((item) => item.id === droppedOnId)
  if (from === -1 || to === -1) return items
  return arrayMove(items, from, to)
}
