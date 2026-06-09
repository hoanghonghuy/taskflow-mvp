import type { Request, Response } from 'express'
import { sendCreated, sendError, sendNoContent, sendSuccess } from '../lib/response'
import * as listService from '../services/listService'
import { createListSchema, updateListSchema } from '../validators/list.validator'

export async function list(req: Request, res: Response): Promise<void> {
  const lists = await listService.listLists(req.userId!)
  sendSuccess(res, lists)
}

export async function getById(req: Request, res: Response): Promise<void> {
  const list = await listService.getList(req.userId!, req.params.id)
  if (!list) {
    sendError(res, 404, 'not_found', 'List not found')
    return
  }
  sendSuccess(res, list)
}

export async function create(req: Request, res: Response): Promise<void> {
  const body = createListSchema.parse(req.body ?? {})
  const list = await listService.createList(req.userId!, body)
  sendCreated(res, list, `/api/lists/${list.id}`)
}

export async function update(req: Request, res: Response): Promise<void> {
  const body = updateListSchema.parse(req.body ?? {})
  const list = await listService.updateList(req.userId!, req.params.id, body)
  if (!list) {
    sendError(res, 404, 'not_found', 'List not found')
    return
  }
  sendSuccess(res, list)
}

export async function remove(req: Request, res: Response): Promise<void> {
  const deleted = await listService.deleteList(req.userId!, req.params.id)
  if (!deleted) {
    sendError(res, 404, 'not_found', 'List not found')
    return
  }
  sendNoContent(res)
}
