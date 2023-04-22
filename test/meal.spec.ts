import { afterAll, beforeAll, describe, beforeEach, test, expect } from 'vitest'
import { app } from '../src/app'
import { execSync } from 'child_process'
import request from 'supertest'

describe('Meals route', () => {
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

  test('should be able to create a new meal', async () => {
    const createUserResponse = await request(app.server)
      .post('/users/create')
      .send({
        name: 'Victor',
        email: 'victor@email.com',
      })

    const cookies = createUserResponse.get('Set-Cookie')

    await request(app.server)
      .post('/meals')
      .send({
        name: 'Xtudo',
        description: 'Lanche da tarde',
        date: '01/02/2012',
        hour: '12:00',
        isInDiet: true,
      })
      .set('Cookie', cookies)
      .expect(201)
  })

  test('should be able to list all meals', async () => {
    const createUserResponse = await request(app.server)
      .post('/users/create')
      .send({
        name: 'Victor',
        email: 'victor@email.com',
      })

    const cookies = createUserResponse.get('Set-Cookie')

    await request(app.server)
      .post('/meals')
      .send({
        name: 'Xtudo',
        description: 'Lanche da tarde',
        date: '01/02/2012',
        hour: '12:00',
        isInDiet: true,
      })
      .set('Cookie', cookies)

    const listMealsResponse = await request(app.server)
      .get('/meals')
      .set('Cookie', cookies)

    expect(listMealsResponse.body.meals).toEqual([
      expect.objectContaining({
        name: 'Xtudo',
        description: 'Lanche da tarde',
        date: '01/02/2012',
        hour: '12:00',
        isInDiet: 1,
      }),
    ])
  })

  test('should be able to get a specific meal', async () => {
    const createUserResponse = await request(app.server)
      .post('/users/create')
      .send({
        name: 'Victor',
        email: 'victor@email.com',
      })

    const cookies = createUserResponse.get('Set-Cookie')

    await request(app.server)
      .post('/meals')
      .send({
        name: 'Xtudo',
        description: 'Lanche da tarde',
        date: '01/02/2012',
        hour: '12:00',
        isInDiet: true,
      })
      .set('Cookie', cookies)

    const listMealsResponse = await request(app.server)
      .get('/meals')
      .set('Cookie', cookies)

    const listOneMealResponse = await request(app.server)
      .get(`/meals/${listMealsResponse.body.meals[0].id}`)
      .set('Cookie', cookies)

    expect(listOneMealResponse.body.meal).toEqual({
      name: 'Xtudo',
      description: 'Lanche da tarde',
      date: '01/02/2012',
      hour: '12:00',
      isInDiet: 1,
      id: listMealsResponse.body.meals[0].id,
      user_id: listMealsResponse.body.meals[0].user_id,
    })
  })

  test('should be able to delete a specific meal', async () => {
    const createUserResponse = await request(app.server)
      .post('/users/create')
      .send({
        name: 'Victor',
        email: 'victor@email.com',
      })

    const cookies = createUserResponse.get('Set-Cookie')

    await request(app.server)
      .post('/meals')
      .send({
        name: 'Xtudo',
        description: 'Lanche da tarde',
        date: '01/02/2012',
        hour: '12:00',
        isInDiet: true,
      })
      .set('Cookie', cookies)

    const listMealsResponse = await request(app.server)
      .get('/meals')
      .set('Cookie', cookies)

    await request(app.server)
      .delete(`/meals/${listMealsResponse.body.meals[0].id}`)
      .set('Cookie', cookies)

    const listMealsAfterDeleteResponse = await request(app.server)
      .get('/meals')
      .set('Cookie', cookies)

    expect(listMealsAfterDeleteResponse.body.meals).toEqual([])
  })
})
