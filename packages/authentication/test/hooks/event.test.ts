import assert from 'assert'
import { feathers, HookContext } from '@feathersjs/feathers'

import hook from '../../src/hooks/event'
import { AuthenticationParams, AuthenticationRequest, AuthenticationResult } from '../../src/core'

describe('authentication/hooks/events', () => {
  const app = feathers().use('authentication', {
    async create(data: AuthenticationRequest) {
      return data
    },

    async remove(id: string) {
      return { id }
    }
  })

  const service = app.service('authentication')

  service.hooks({
    create: [hook('login')],
    remove: [hook('logout')]
  })

  it('login', () =>
    new Promise<void>((done) => {
      const data = {
        message: 'test'
      }

      app.once(
        'login',
        (result: AuthenticationResult, params: AuthenticationParams, context: HookContext) => {
          try {
            assert.deepStrictEqual(result, data)
            assert.ok(params.testParam)
            assert.ok(context.method, 'create')
            done()
          } catch (error: any) {
            done(error)
          }
        }
      )

      service.create(data, {
        testParam: true,
        provider: 'test'
      } as any)
    }))

  it('logout', () =>
    new Promise<void>((done) => {
      app.once(
        'logout',
        (result: AuthenticationResult, params: AuthenticationParams, context: HookContext) => {
          try {
            assert.deepStrictEqual(result, {
              id: 'test'
            })
            assert.ok(params.testParam)
            assert.ok(context.method, 'remove')
            done()
          } catch (error: any) {
            done(error)
          }
        }
      )

      service.remove('test', {
        testParam: true,
        provider: 'test'
      } as any)
    }))

  it('does nothing when provider is not set', () =>
    new Promise<void>((done) => {
      const handler = () => {
        done(new Error('Should never get here'))
      }

      app.on('logout', handler)
      service.once('removed', (result: AuthenticationResult) => {
        app.removeListener('logout', handler)
        assert.deepStrictEqual(result, {
          id: 'test'
        })
        done()
      })

      service.remove('test')
    }))
})
