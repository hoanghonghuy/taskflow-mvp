import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import {
  SettingsList,
  SettingsRow,
} from '@/components/ui/settings-list'
import {
  DetailSection,
  PropertyList,
  PropertyRow,
  fieldControlClassName,
} from '@/components/ui/property-list'

describe('SettingsList / SettingsRow', () => {
  it('renders a settings list with divided rows and trailing control', () => {
    render(
      <SettingsList data-testid="settings-list">
        <SettingsRow label="Auto start" description="Start next session automatically" htmlFor="auto">
          <button type="button" id="auto">
            Toggle
          </button>
        </SettingsRow>
      </SettingsList>,
    )

    expect(screen.getByTestId('settings-list')).toBeInTheDocument()
    expect(screen.getByText('Auto start')).toBeInTheDocument()
    expect(screen.getByText('Start next session automatically')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Auto start' })).toHaveAttribute('id', 'auto')
    expect(screen.getByText('Toggle')).toBeInTheDocument()
  })
})

describe('PropertyList / PropertyRow / DetailSection', () => {
  it('renders property rows with label and control', () => {
    render(
      <PropertyList title="Details" data-testid="property-list">
        <PropertyRow label="Priority">
          <select aria-label="Priority">
            <option>High</option>
          </select>
        </PropertyRow>
      </PropertyList>,
    )

    expect(screen.getByTestId('property-list')).toBeInTheDocument()
    expect(screen.getByText('Details')).toBeInTheDocument()
    expect(screen.getByText('Priority')).toBeInTheDocument()
    expect(screen.getByLabelText('Priority')).toBeInTheDocument()
  })

  it('exposes a shared field control class for inputs/selects', () => {
    expect(fieldControlClassName).toContain('rounded-md')
    expect(fieldControlClassName).toContain('border-input')
  })

  it('renders a flat detail section with optional action', () => {
    render(
      <DetailSection title="Subtasks" action={<button type="button">Generate</button>}>
        <p>Empty</p>
      </DetailSection>,
    )

    expect(screen.getByText('Subtasks')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Generate' })).toBeInTheDocument()
    expect(screen.getByText('Empty')).toBeInTheDocument()
  })
})
