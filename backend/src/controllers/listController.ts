import type { Request, Response } from 'express'
import * as listService from '../services/listService'
import { createListSchema, updateListSchema } from '../validators/list.validator'

export async function list(req: Request, res: Response): Promise<void> {
  const lists = await listService.listLists(req.userId!)
  res.status(200).json(lists)
}

export async function getById(req: Request, res: Response): Promise<void> {
  const list = await listService.getList(req.userId!, req.params.id)
  if (!list) {
    res.status(404).json({ error: 'not_found', message: 'List not found' })
    return
  }
  res.status(200).json(list)
}

export async function create(req: Request, res: Response): Promise<void> {
  const body = createListSchema.parse(req.body ?? {})
  const list = await listService.createList(req.userId!, body)
  res.status(201).location(`/api/lists/${list.id}`).json(list)
}

export async function update(req: Request, res: Response): Promise<void> {
  const body = updateListSchema.parse(req.body ?? {})
  const list = await listService.updateList(req.userId!, req.params.id, body)
  if (!list) {
    res.status(404).json({ error: 'not_found', message: 'List not found' })
    return
  }
  res.status(200).json(list)
}

export async function remove(req: Request, res: Response): Promise<void> {
  const deleted = await listService.deleteList(req.userId!, req.params.id)
  if (!deleted) {
    res.status(404).json({ error: 'not_found', message: 'List not found' })
    return
  }
  res.status(204).send()
}
