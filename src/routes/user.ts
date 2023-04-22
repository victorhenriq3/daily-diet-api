import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { db } from '../database'
import { randomUUID } from 'crypto'

export async function userRoutes(app: FastifyInstance) {
  app.post('/create', async (request, reply) => {
    const createUserBodySchema = z.object({
      email: z.string().email(),
      name: z.string(),
    })

    const { email, name } = createUserBodySchema.parse(request.body)

    const [userId] = await db('users').insert({
      id: randomUUID(),
      email,
      name,
    })

    let sessionId = request.cookies.sessionId

    if (!sessionId) {
      sessionId = randomUUID()
      reply.setCookie('sessionId', sessionId, {
        path: '/',
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 365, // 1 year
      })
    }

    await db('sessions').insert({
      id: sessionId,
      user_id: userId,
    })

    return reply.status(201).send({ message: 'User created' })
  })
}
