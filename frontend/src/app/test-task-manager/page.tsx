'use client'

import { useTaskManager, useTaskActions } from '@/lib/hooks/use-task-manager'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useState } from 'react'

export default function TestTaskManagerPage() {
  const { state, dispatch, canUndo, canRedo } = useTaskManager()
  const { addTask, toggleTask, deleteTask } = useTaskActions()
  const [title, setTitle] = useState('')

  const handleAddTask = () => {
    if (!title.trim()) return
    
    addTask({
      title,
      description: '',
      completed: false,
      priority: 'medium',
      listId: 'inbox',
      tags: [],
      subtasks: [],
      comments: [],
    })
    setTitle('')
  }

  return (
    <div className="p-8 space-y-6 max-w-2xl">
      <h1 className="text-3xl font-bold">TaskManager Test</h1>

      {/* Undo/Redo */}
      <div className="flex gap-2">
        <Button onClick={() => dispatch({ type: 'UNDO' })} disabled={!canUndo}>
          Undo
        </Button>
        <Button onClick={() => dispatch({ type: 'REDO' })} disabled={!canRedo}>
          Redo
        </Button>
      </div>

      {/* Add Task */}
      <div className="flex gap-2">
        <Input
          placeholder="Task title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
        />
        <Button onClick={handleAddTask}>Add Task</Button>
      </div>

      {/* Task List */}
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Tasks ({state.tasks.length})</h2>
        {state.tasks.map(task => (
          <div key={task.id} className="flex items-center gap-2 p-2 border rounded">
            <input
              type="checkbox"
              checked={task.completed}
              onChange={() => toggleTask(task.id)}
            />
            <span className={task.completed ? 'line-through' : ''}>{task.title}</span>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => deleteTask(task.id)}
            >
              Delete
            </Button>
          </div>
        ))}
      </div>

      {/* Stats */}
      <div className="p-4 border rounded space-y-1">
        <p>Total tasks: {state.tasks.length}</p>
        <p>Completed: {state.tasks.filter(t => t.completed).length}</p>
        <p>Lists: {state.lists.length}</p>
        <p>Habits: {state.habits.length}</p>
        <p>Can undo: {canUndo ? 'Yes' : 'No'}</p>
        <p>Can redo: {canRedo ? 'Yes' : 'No'}</p>
      </div>
    </div>
  )
}
