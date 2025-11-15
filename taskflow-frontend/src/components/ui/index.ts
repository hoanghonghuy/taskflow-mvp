/**
 * UI Components Barrel Export
 * 
 * This file provides a centralized export point for all UI components.
 * This ensures consistent import patterns and prevents export/import mismatches.
 * 
 * Usage:
 *   import { Avatar, Button } from '@/components/ui'
 *   // or
 *   import Avatar from '@/components/ui/avatar'
 */

// Avatar: supports both default and named export
export { default as Avatar, Avatar } from './avatar'

// Button: named export only
export { Button, buttonVariants } from './button'
export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from './dialog'
export {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from './alert-dialog'

