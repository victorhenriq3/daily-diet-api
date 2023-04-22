import { randomUUID } from 'crypto'
import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { db } from '../database'
import moment from 'moment'

interface UpdateMeal {
  name?: string
  description?: string
  date?: string
  hour?: string
  isInDiet?: boolean
}

export async function mealRoutes(app: FastifyInstance) {
  app.post('/', async (request, reply) => {
    const createMealSchema = z.object({
      name: z.string(),
      description: z.string(),
      date: z.string(),
      hour: z.string(),
      isInDiet: z.boolean(),
    })

    const { sessionId } = request.cookies

    const { user_id } = await db('sessions')
      .select('user_id')
      .where({ id: sessionId })
      .first()

    console.log(user_id)

    const { name, description, date, hour, isInDiet } = createMealSchema.parse(
      request.body,
    )

    await db('meals').insert({
      id: randomUUID(),
      name,
      description,
      date,
      hour,
      isInDiet,
      user_id,
    })

    return reply.status(201).send({ message: 'Meal created' })
  })

  app.get('/', async (request, reply) => {
    const { sessionId } = request.cookies

    const { user_id } = await db('sessions')
      .select('user_id')
      .where({ id: sessionId })
      .first()

    if (!user_id) {
      return reply.status(404).send({ message: 'User not found' })
    }

    const meals = await db('meals').where({ user_id })

    return reply.status(200).send({ meals })
  })

  app.get('/:id', async (request, reply) => {
    const { sessionId } = request.cookies

    const getMealParamsSchema = z.object({
      id: z.string().uuid(),
    })

    const { id } = getMealParamsSchema.parse(request.params)

    const { user_id } = await db('sessions')
      .select('user_id')
      .where({ id: sessionId })
      .first()

    if (!user_id) {
      return reply.status(404).send({ message: 'User not found' })
    }

    const meal = await db('meals')
      .select('*')
      .where({
        id,
        user_id,
      })
      .first()

    if (!meal) {
      return reply.status(404).send({ message: 'Meal not found' })
    }

    return reply.status(200).send({ meal })
  })

  app.delete('/:id', async (request, reply) => {
    const { sessionId } = request.cookies

    const deleteMealParamsSchema = z.object({
      id: z.string().uuid(),
    })

    const { id } = deleteMealParamsSchema.parse(request.params)

    const { user_id } = await db('sessions')
      .select('user_id')
      .where({ id: sessionId })
      .first()

    if (!user_id) {
      return reply.status(404).send({ message: 'User not found' })
    }

    const meal = await db('meals').select('*').where({}).first()

    if (!meal) {
      return reply.status(404).send({ message: 'Meal not found' })
    }

    await db('meals').where({ id }).del()

    return reply.status(200).send({ message: 'Meal deleted' })
  })

  app.put('/:id', async (request, reply) => {
    const sessionId = request.cookies.sessionId

    const updateMealParamsSchema = z.object({
      id: z.string().uuid(),
    })

    const { id } = updateMealParamsSchema.parse(request.params)

    const { user_id } = await db('sessions')
      .select('user_id')
      .where({ id: sessionId })
      .first()

    if (!user_id) {
      return reply.status(404).send({ message: 'User not found' })
    }

    const meal = await db('meals')
      .select('*')
      .where({
        id,
      })
      .first()

    if (!meal) {
      return reply.status(404).send({ message: 'Meal not found' })
    }

    const updateMealSchema = z.object({
      name: z.string().optional(),
      description: z.string().optional(),
      date: z.string().optional(),
      hour: z.string().optional(),
      isInDiet: z.boolean().optional(),
    })

    const { name, description, date, hour, isInDiet } = updateMealSchema.parse(
      request.body,
    )

    const updateFields: UpdateMeal = {}
    if (name !== undefined) updateFields.name = name
    if (description !== undefined) updateFields.description = description
    if (date !== undefined) updateFields.date = date
    if (hour !== undefined) updateFields.hour = hour
    if (isInDiet !== undefined) updateFields.isInDiet = isInDiet

    await db('meals').where({ id }).update(updateFields)
  })

  app.get('/summary', async (request, reply) => {
    const sessionId = request.cookies.sessionId

    const { user_id } = await db('sessions')
      .select('user_id')
      .where({ id: sessionId })
      .first()

    if (!user_id) {
      return reply.status(404).send({ message: 'User not found' })
    }

    const totalMeals = await db('meals').where({ user_id })

    const totalMealsInDiet = await db('meals').where({
      user_id,
      isInDiet: true,
    })

    const totalMealsNotInDiet = await db('meals').where({
      user_id,
      isInDiet: false,
    })

    const meals = await db('meals')
      .where({ user_id, isInDiet: true })
      .orderBy('date', 'asc')
      .orderBy('hour', 'asc')

    const dailySequences = []

    let currentSeq = 0
    let currentDate = null

    for (const meal of meals) {
      const mealDate = moment(meal.date + ' ' + meal.hour, 'YYYY-MM-DD HH:mm')
      const mealSeq = mealDate.isSame(currentDate, 'day') ? currentSeq + 1 : 1

      if (mealSeq > currentSeq) {
        currentSeq = mealSeq
      }

      if (
        !mealDate.isSame(currentDate, 'day') ||
        meal === meals[meals.length - 1]
      ) {
        dailySequences.push(currentSeq)
        currentSeq = 0
        currentDate = mealDate.clone().startOf('day')
      }

      currentDate = mealDate.clone()
    }

    const bestSequence = Math.max(...dailySequences)

    const summary = {
      totalMeals: totalMeals.length,
      totalMealsInDiet: totalMealsInDiet.length,
      totalMealsNotInDiet: totalMealsNotInDiet.length,
      bestSequence,
    }

    return reply.status(200).send({ summary })
  })
}
