import type { AppState } from '@/types'
import type { Action } from './types'
import { viewReducer } from './reducers/view-reducer'
import { tagReducer } from './reducers/tag-reducer'
import { taskReducer } from './reducers/task-reducer'
import { listReducer } from './reducers/list-reducer'
import { columnReducer } from './reducers/column-reducer'
import { habitReducer } from './reducers/habit-reducer'
import { countdownReducer } from './reducers/countdown-reducer'
import { pomodoroReducer } from './reducers/pomodoro-reducer'

export function taskManagerReducer(state: AppState, action: Action): AppState {
  if (action.type === 'LOAD_STATE') {
    return action.payload
  }

  let nextState = state

  nextState = viewReducer(nextState, action)
  if (nextState !== state) return nextState

  nextState = tagReducer(nextState, action)
  if (nextState !== state) return nextState

  nextState = taskReducer(nextState, action)
  if (nextState !== state) return nextState

  nextState = listReducer(nextState, action)
  if (nextState !== state) return nextState

  nextState = columnReducer(nextState, action)
  if (nextState !== state) return nextState

  nextState = habitReducer(nextState, action)
  if (nextState !== state) return nextState

  nextState = countdownReducer(nextState, action)
  if (nextState !== state) return nextState

  nextState = pomodoroReducer(nextState, action)
  if (nextState !== state) return nextState

  return state
}
