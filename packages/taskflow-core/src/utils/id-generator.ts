/**
 * Cross-platform ID generator
 * Works in both web and React Native environments
 */

export function generateId(): string {
  // Use timestamp + random string for uniqueness
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `${timestamp}_${randomStr}`;
}

export function generateShortId(length: number = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Generate UUID-like ID for better uniqueness
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Generate task-specific ID with prefix
export function generateTaskId(): string {
  return `task_${generateId()}`;
}

export function generateListId(): string {
  return `list_${generateId()}`;
}

export function generateHabitId(): string {
  return `habit_${generateId()}`;
}

export function generateEventId(): string {
  return `event_${generateId()}`;
}
