import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const countdownSource = readFileSync(
  path.join(process.cwd(), 'src/features/countdown/views/CountdownView.tsx'),
  'utf8',
)

describe('Countdown card styling', () => {
  it('keeps upcoming cards on one shared visual style', () => {
    expect(countdownSource).toContain(
      "'relative h-full overflow-hidden border-border/70 shadow-sm transition-[border-color,box-shadow] duration-150 motion-reduce:transition-none'",
    )
    expect(countdownSource).not.toContain("isNext && 'border-primary/30 shadow-sm'")
  })
})
