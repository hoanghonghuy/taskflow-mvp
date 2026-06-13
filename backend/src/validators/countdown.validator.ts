import { z } from 'zod'
import { optionalDateStringSchema } from './common'

// Accept both hex colors and color names (for frontend compatibility)
const colorSchema = z.string().refine(
  (color) => {
    // Accept hex format #RRGGBB
    if (/^#[0-9A-Fa-f]{6}$/.test(color)) return true
    // Accept color names (sky, sunset, forest, violet, amber, etc.)
    if (/^[a-z]+$/.test(color)) return true
    return false
  },
  { message: 'Invalid color format. Use hex (#RRGGBB) or color name.' }
)

export const createCountdownSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200, 'Title too long'),
  targetDate: z.string().datetime(),
  color: colorSchema.optional().default('#3b82f6'),
})

export const updateCountdownSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200, 'Title too long').optional(),
  targetDate: z.string().datetime().optional(),
  color: colorSchema.optional(),
})
