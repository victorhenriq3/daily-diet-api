import { afterAll, beforeAll, describe, beforeEach, test } from 'vitest'
import { app } from '../src/app'
import { execSync } from 'child_process'
import request from 'supertest'

describe('User route', () => {
  beforeAll(async () => {
    app.ready()
  })

  afterAll(async () => {
    app.close()
  })

  beforeEach(() => {
    execSync('npm run knex migrate:rollback --all')
    execSync('npm run knex migrate:latest')
  })

  test('should be able to create a new user', async () => {
    await request(app.server)
      .post('/users/create')
      .send({
        name: 'Victor',
        email: 'victor@email.com',
      })
      .expect(201)
  })
})
