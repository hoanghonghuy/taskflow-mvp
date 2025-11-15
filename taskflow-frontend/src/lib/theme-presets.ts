import type { ThemePresetId } from '@/types'

export interface ThemePreset {
  id: ThemePresetId
  labelKey: string
  descriptionKey: string
  mode: 'light' | 'dark'
  preview: {
    background: string
    card: string
    accent: string
  }
}

export const THEME_PRESET_IDS: ThemePresetId[] = [
  'light',
  'dark',
  'classic-fog',
  'warm-ivory',
  'cool-slate',
  'minimal-charcoal',
  'soft-pastel',
  'night-indigo',
  'graphite-ember',
  'forest-noir',
  'plum-eclipse',
  'carbon-minimal',
]

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'light',
    labelKey: 'settings.themePresets.light',
    descriptionKey: 'settings.themePresets.lightDesc',
    mode: 'light',
    preview: {
      background: '#f4f6f9',
      card: '#ffffff',
      accent: '#4ba3ff',
    },
  },
  {
    id: 'dark',
    labelKey: 'settings.themePresets.dark',
    descriptionKey: 'settings.themePresets.darkDesc',
    mode: 'dark',
    preview: {
      background: '#111318',
      card: '#1c1f27',
      accent: '#3dd5ff',
    },
  },
  {
    id: 'classic-fog',
    labelKey: 'settings.themePresets.classicFog',
    descriptionKey: 'settings.themePresets.classicFogDesc',
    mode: 'light',
    preview: {
      background: '#edf1f4',
      card: '#ffffff',
      accent: '#5c7cfa',
    },
  },
  {
    id: 'warm-ivory',
    labelKey: 'settings.themePresets.warmIvory',
    descriptionKey: 'settings.themePresets.warmIvoryDesc',
    mode: 'light',
    preview: {
      background: '#fdf7f0',
      card: '#ffffff',
      accent: '#f59e0b',
    },
  },
  {
    id: 'cool-slate',
    labelKey: 'settings.themePresets.coolSlate',
    descriptionKey: 'settings.themePresets.coolSlateDesc',
    mode: 'light',
    preview: {
      background: '#f2f4f7',
      card: '#ffffff',
      accent: '#0ea5e9',
    },
  },
  {
    id: 'minimal-charcoal',
    labelKey: 'settings.themePresets.minimalCharcoal',
    descriptionKey: 'settings.themePresets.minimalCharcoalDesc',
    mode: 'light',
    preview: {
      background: '#f5f5f4',
      card: '#ffffff',
      accent: '#1f2937',
    },
  },
  {
    id: 'soft-pastel',
    labelKey: 'settings.themePresets.softPastel',
    descriptionKey: 'settings.themePresets.softPastelDesc',
    mode: 'light',
    preview: {
      background: '#fdf2f8',
      card: '#ffffff',
      accent: '#ec4899',
    },
  },
  {
    id: 'night-indigo',
    labelKey: 'settings.themePresets.nightIndigo',
    descriptionKey: 'settings.themePresets.nightIndigoDesc',
    mode: 'dark',
    preview: {
      background: '#070b16',
      card: '#101528',
      accent: '#8b5cf6',
    },
  },
  {
    id: 'graphite-ember',
    labelKey: 'settings.themePresets.graphiteEmber',
    descriptionKey: 'settings.themePresets.graphiteEmberDesc',
    mode: 'dark',
    preview: {
      background: '#0f1115',
      card: '#181b22',
      accent: '#f97316',
    },
  },
  {
    id: 'forest-noir',
    labelKey: 'settings.themePresets.forestNoir',
    descriptionKey: 'settings.themePresets.forestNoirDesc',
    mode: 'dark',
    preview: {
      background: '#050c0b',
      card: '#0f1a17',
      accent: '#34d399',
    },
  },
  {
    id: 'plum-eclipse',
    labelKey: 'settings.themePresets.plumEclipse',
    descriptionKey: 'settings.themePresets.plumEclipseDesc',
    mode: 'dark',
    preview: {
      background: '#120414',
      card: '#1d0f24',
      accent: '#d946ef',
    },
  },
  {
    id: 'carbon-minimal',
    labelKey: 'settings.themePresets.carbonMinimal',
    descriptionKey: 'settings.themePresets.carbonMinimalDesc',
    mode: 'dark',
    preview: {
      background: '#050505',
      card: '#101010',
      accent: '#4ade80',
    },
  },
]

export const THEME_PRESET_MAP = THEME_PRESETS.reduce<Record<ThemePresetId, ThemePreset>>((acc, preset) => {
  acc[preset.id] = preset
  return acc
}, {} as Record<ThemePresetId, ThemePreset>)

export const DARK_THEME_IDS = new Set(
  THEME_PRESETS.filter((preset) => preset.mode === 'dark').map((preset) => preset.id)
)

export const isDarkThemeId = (id: ThemePresetId) => DARK_THEME_IDS.has(id)

