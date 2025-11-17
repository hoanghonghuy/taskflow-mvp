import type { AppState } from '@/types'
import type { Action } from '../types'

export function tagReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'ADD_TAG': {
      const newTagName = action.payload.name.trim().toLowerCase()
      if (newTagName && !state.tags.includes(newTagName)) {
        return { ...state, tags: [...state.tags, newTagName] }
      }
      return state
    }

    case 'DELETE_TAG': {
      const tagToDelete = action.payload
      return {
        ...state,
        tags: state.tags.filter(tag => tag !== tagToDelete),
        tasks: state.tasks.map(task => ({
          ...task,
          tags: task.tags.filter(tag => tag !== tagToDelete),
        })),
        activeTag: state.activeTag === tagToDelete ? null : state.activeTag,
      }
    }

    default:
      return state
  }
}
