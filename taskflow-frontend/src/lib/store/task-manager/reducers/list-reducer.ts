import type { AppState, List } from '@/types'
import type { Action } from '../types'
import { generateId } from '@/lib/utils'

export function listReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'ADD_LIST': {
      const newList: List = { ...action.payload, id: generateId() }
      return { ...state, lists: [...state.lists, newList] }
    }

    case 'UPDATE_LIST':
      return {
        ...state,
        lists: state.lists.map(l => (l.id === action.payload.id ? action.payload : l)),
      }

    case 'UPDATE_LIST_MEMBERS': {
      const { listId, memberIds } = action.payload
      return {
        ...state,
        lists: state.lists.map(l => (l.id === listId ? { ...l, members: memberIds } : l)),
      }
    }

    case 'DELETE_LIST':
      return {
        ...state,
        lists: state.lists.filter(l => l.id !== action.payload),
        tasks: state.tasks.filter(t => t.listId !== action.payload),
        columns: state.columns.filter(c => c.listId !== action.payload),
      }

    case 'SHARE_LIST':
      return {
        ...state,
        lists: state.lists.map(l =>
          l.id === action.payload.listId
            ? { ...l, members: [...l.members, action.payload.userId] }
            : l,
        ),
      }

    case 'UNSHARE_LIST':
      return {
        ...state,
        lists: state.lists.map(l =>
          l.id === action.payload.listId
            ? { ...l, members: l.members.filter(id => id !== action.payload.userId) }
            : l,
        ),
      }

    default:
      return state
  }
}
