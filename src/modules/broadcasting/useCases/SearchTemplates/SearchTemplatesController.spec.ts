/**
 * @jest-environment ./prisma/prisma-test-environment.js
 */

import request from 'supertest'
import { v4 as uuid } from 'uuid'

import { app } from '@infra/http/app'
import { prisma } from '@infra/prisma/client'
import { redisConnection } from '@infra/redis/connection'
import { createAndAuthenticateUser } from '@test/factories/UserFactory'

describe('Search Templates (e2e)', () => {
  afterAll(async () => {
    redisConnection.disconnect()
    await prisma.$disconnect()
  })

  it('should be able to search templates', async () => {
    const {
      jwt: { token },
    } = createAndAuthenticateUser()

    await prisma.template.createMany({
      data: [
        {
          id: uuid(),
          title: 'template-1',
          content: 'Message template with {{ message_content }} variable.',
        },
        {
          id: uuid(),
          title: 'template-2',
          content: 'Message template with {{ message_content }} variable.',
        },
      ],
    })

    const response = await request(app)
      .get(`/templates/search`)
      .set('x-access-token', token)
      .query({
        query: 'plate-1',
      })
      .send()

    expect(response.status).toBe(200)
    expect(response.body.length).toBe(1)
    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: 'template-1',
        }),
      ])
    )
  })
})