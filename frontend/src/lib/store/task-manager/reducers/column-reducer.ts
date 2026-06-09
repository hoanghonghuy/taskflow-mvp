import type { AppState, Column } from '@/types'
import type { Action } from '../types'
import { generateId } from '@/lib/utils'

export function columnReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'ADD_COLUMN': {
      const newColumn: Column = {
        id: generateId(),
        name: action.payload.name,
        listId: action.payload.listId,
      }
      return { ...state, columns: [...state.columns, newColumn] }
    }

    case 'UPDATE_COLUMN':
      return {
        ...state,
        columns: state.columns.map(c =>
          c.id === action.payload.columnId ? { ...c, name: action.payload.name } : c,
        ),
      }

    case 'DELETE_COLUMN': {
      const { columnId, listId } = action.payload
      const columnsForList = state.columns.filter(c => c.listId === listId)
      const firstColumnId = columnsForList[0]?.id

      return {
        ...state,
        columns: state.columns.filter(c => c.id !== columnId),
        tasks: state.tasks.map(t =>
          t.columnId === columnId ? { ...t, columnId: firstColumnId } : t,
        ),
      }
    }

    case 'MOVE_TASK_TO_COLUMN':
      return {
        ...state,
        tasks: state.tasks.map(t =>
          t.id === action.payload.taskId
            ? { ...t, columnId: action.payload.newColumnId, listId: action.payload.listId }
            : t,
        ),
      }

    case 'REORDER_COLUMNS': {
      const { listId, draggedId, droppedOnId } = action.payload
      const columnsForList = state.columns.filter(c => c.listId === listId)
      const otherColumns = state.columns.filter(c => c.listId !== listId)

      const draggedIndex = columnsForList.findIndex(c => c.id === draggedId)
      const droppedIndex = columnsForList.findIndex(c => c.id === droppedOnId)

      if (draggedIndex === -1 || droppedIndex === -1) return state

      const reordered = [...columnsForList]
      const [draggedColumn] = reordered.splice(draggedIndex, 1)
      reordered.splice(droppedIndex, 0, draggedColumn)

      return { ...state, columns: [...otherColumns, ...reordered] }
    }

    default:
      return state
  }
}
