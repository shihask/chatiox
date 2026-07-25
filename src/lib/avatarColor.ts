const AVATAR_PALETTE = [
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
  'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-400',
  'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
]

/** Deterministic (same id -> same color) so a contact's avatar color stays stable across renders
 * and screens, without persisting a color choice anywhere. */
export function avatarClassFor(id: string): string {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length] ?? 'bg-secondary text-secondary-foreground'
}
