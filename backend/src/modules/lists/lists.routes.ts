import { Router } from 'express'
import { requireAuth } from '../../middleware/auth'
import { asyncHandler } from '../../middleware/errorHandler'
import * as listsService from './lists.service'

export const listsRouter = Router()

listsRouter.use(requireAuth)

listsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const lists = await listsService.listLists(req.userId!)
    res.status(200).json(lists)
  }),
)

listsRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const list = await listsService.getList(req.userId!, req.params.id)
    if (!list) {
      res.status(404).json({ error: 'not_found', message: 'List not found' })
      return
    }
    res.status(200).json(list)
  }),
)

listsRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const list = await listsService.createList(req.userId!, req.body)
    res.status(201).location(`/api/lists/${list.id}`).json(list)
  }),
)

listsRouter.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const list = await listsService.updateList(req.userId!, req.params.id, req.body)
    if (!list) {
      res.status(404).json({ error: 'not_found', message: 'List not found' })
      return
    }
    res.status(200).json(list)
  }),
)

listsRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const deleted = await listsService.deleteList(req.userId!, req.params.id)
    if (!deleted) {
      res.status(404).json({ error: 'not_found', message: 'List not found' })
      return
    }
    res.status(204).send()
  }),
)
