import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

describe('app icon contract', () => {
  it('defines a brand app icon from the sidebar mark', () => {
    const iconPath = path.join(process.cwd(), 'src/app/icon.svg')
    expect(existsSync(iconPath)).toBe(true)

    const icon = readFileSync(iconPath, 'utf8')
    expect(icon).toContain('viewBox="0 0 256 256"')
    expect(icon).toContain('M128,24a104,104,0,1,0,104,104')
  })
})
