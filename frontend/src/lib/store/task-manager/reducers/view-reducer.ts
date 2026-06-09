import type { AppState } from '@/types'
import type { Action } from '../types'

export function viewReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_VIEW':
      return { ...state, view: action.payload }

    case 'SET_SELECTED_TASK':
      return { ...state, selectedTaskId: action.payload }

    case 'SET_ACTIVE_LIST':
      return {
        ...state,
        activeListId: action.payload,
        activeTag: null,
        selectedTaskId: null,
        view: 'list',
      }

    case 'SET_ACTIVE_TAG':
      return {
        ...state,
        activeTag: action.payload,
        activeListId: 'inbox',
        selectedTaskId: null,
        view: 'list',
      }

    case 'SET_SORT_ORDER':
      return { ...state, sortOrder: action.payload }

    default:
      return state
  }
}
