import request from 'supertest'
import { app, authHeader, registerAndLogin, resetDatabase, apiData } from '../helpers'

type ListDto = { id: string; name: string; members: string[] }
type TaskDto = { id: string; title: string; listId: string }
type UserDto = { id: string; name: string; email: string }

describe('List collaboration (shared access)', () => {
  beforeEach(async () => {
    await resetDatabase()
  })

  it('member sees shared list, tasks, and list owner in collaborators', async () => {
    const owner = await registerAndLogin('owner@test.com', 'OwnerPass123!', 'Owner')
    const member = await registerAndLogin('member@test.com', 'MemberPass123!', 'Member')

    const createListRes = await request(app)
      .post('/api/lists')
      .set(authHeader(owner.token))
      .send({ name: 'Team Board', color: '#3b82f6', members: [] })
      .expect(201)

    const sharedList = apiData<ListDto>(createListRes)

    await request(app)
      .put(`/api/lists/${sharedList.id}`)
      .set(authHeader(owner.token))
      .send({ members: [member.userId] })
      .expect(200)

    const createTaskRes = await request(app)
      .post('/api/tasks')
      .set(authHeader(owner.token))
      .send({ title: 'Shared task', listId: sharedList.id, priority: 'high' })
      .expect(201)

    const sharedTask = apiData<TaskDto>(createTaskRes)

    const memberListsRes = await request(app)
      .get('/api/lists')
      .set(authHeader(member.token))
      .expect(200)

    const memberLists = apiData<ListDto[]>(memberListsRes)
    expect(memberLists.some((list: ListDto) => list.id === sharedList.id)).toBe(true)

    const memberTasksRes = await request(app)
      .get('/api/tasks')
      .set(authHeader(member.token))
      .expect(200)

    const memberTasks = apiData<TaskDto[]>(memberTasksRes)
    expect(memberTasks.some((task: TaskDto) => task.id === sharedTask.id)).toBe(true)

    const memberGetTaskRes = await request(app)
      .get(`/api/tasks/${sharedTask.id}`)
      .set(authHeader(member.token))
      .expect(200)

    expect(apiData<TaskDto>(memberGetTaskRes).title).toBe('Shared task')

    const collaboratorsRes = await request(app)
      .get('/api/auth/collaborators')
      .set(authHeader(member.token))
      .expect(200)

    const collaborators = apiData<UserDto[]>(collaboratorsRes)
    expect(collaborators.some((user: UserDto) => user.id === owner.userId)).toBe(true)
  })

  it('member cannot update or delete owner task', async () => {
    const owner = await registerAndLogin('owner2@test.com', 'OwnerPass123!', 'Owner')
    const member = await registerAndLogin('member2@test.com', 'MemberPass123!', 'Member')

    const createListRes = await request(app)
      .post('/api/lists')
      .set(authHeader(owner.token))
      .send({ name: 'Restricted', color: '#3b82f6', members: [member.userId] })
      .expect(201)

    const list = apiData<ListDto>(createListRes)

    const createTaskRes = await request(app)
      .post('/api/tasks')
      .set(authHeader(owner.token))
      .send({ title: 'Owner only', listId: list.id })
      .expect(201)

    const task = apiData<TaskDto>(createTaskRes)

    await request(app)
      .put(`/api/tasks/${task.id}`)
      .set(authHeader(member.token))
      .send({ title: 'Hijacked' })
      .expect(404)

    await request(app)
      .delete(`/api/tasks/${task.id}`)
      .set(authHeader(member.token))
      .expect(404)
  })

  it('member cannot update or delete owner list', async () => {
    const owner = await registerAndLogin('owner3@test.com', 'OwnerPass123!', 'Owner')
    const member = await registerAndLogin('member3@test.com', 'MemberPass123!', 'Member')

    const createListRes = await request(app)
      .post('/api/lists')
      .set(authHeader(owner.token))
      .send({ name: 'Protected', color: '#3b82f6', members: [member.userId] })
      .expect(201)

    const list = apiData<ListDto>(createListRes)

    await request(app)
      .put(`/api/lists/${list.id}`)
      .set(authHeader(member.token))
      .send({ name: 'Renamed by member' })
      .expect(404)

    await request(app)
      .delete(`/api/lists/${list.id}`)
      .set(authHeader(member.token))
      .expect(404)
  })
})
