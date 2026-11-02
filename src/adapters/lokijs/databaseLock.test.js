import { LokiMemoryAdapter } from 'lokijs'

import { testSchema, mockTaskRaw } from '../__tests__/helpers'
import logger from '../../utils/common/logger'

import LokiJSAdapter from './index'
import DatabaseAdapterCompat from '../compat'

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// Mimics the Web Locks API (navigator.locks) shared by all tabs of the same origin
class FakeLockManager {
  held = new Map()

  waiting = new Map()

  requestCount = 0

  request(name, options, callback) {
    this.requestCount += 1
    return new Promise((resolve, reject) => {
      const grant = () => {
        const holder = { reject }
        this.held.set(name, holder)
        Promise.resolve(callback({ name, mode: options.mode })).then(
          (value) => {
            this._release(name, holder)
            resolve(value)
          },
          (error) => {
            this._release(name, holder)
            reject(error)
          },
        )
      }
      if (!this.held.has(name)) {
        grant()
      } else if (options.ifAvailable) {
        Promise.resolve(callback(null)).then(resolve, reject)
      } else {
        this.waiting.set(name, [...(this.waiting.get(name) || []), grant])
      }
    })
  }

  _release(name, holder) {
    if (this.held.get(name) !== holder) {
      return
    }
    this.held.delete(name)
    const [next, ...rest] = this.waiting.get(name) || []
    this.waiting.set(name, rest)
    next && next()
  }

  // The browser releases locks held by a tab when it's closed
  closeHolder(name) {
    this._release(name, this.held.get(name))
  }

  // What happens to the holder when another tab requests the lock with `steal: true`
  steal(name) {
    const holder = this.held.get(name)
    this.held.delete(name)
    holder.reject(new DOMException('Lock broken by another request', 'AbortError'))
  }
}

const originalNavigator = Object.getOwnPropertyDescriptor(global, 'navigator')
const setNavigator = (value) => {
  Object.defineProperty(global, 'navigator', { value, configurable: true, writable: true })
}

let locks
let adapters = []

beforeEach(() => {
  locks = new FakeLockManager()
  setNavigator({ locks })
})

afterEach(() => {
  adapters.forEach((adapter) => {
    const loki = adapter._driver?.loki
    loki && loki.autosaveDisable()
  })
  adapters = []
  if (originalNavigator) {
    Object.defineProperty(global, 'navigator', originalNavigator)
  } else {
    delete global.navigator
  }
})

// Each adapter is like a separate tab of the same app
const openTab = (options) => {
  const lokiAdapter = new LokiJSAdapter({
    dbName: 'app',
    schema: testSchema,
    useWebWorker: false,
    useIncrementalIndexedDB: true,
    _testLokiAdapter: new LokiMemoryAdapter(),
    ...options,
  })
  adapters.push(lokiAdapter)
  return new DatabaseAdapterCompat(lokiAdapter)
}

const isSettled = async (promise) => {
  let settled = false
  promise.then(
    () => {
      settled = true
    },
    () => {
      settled = true
    },
  )
  await sleep(20)
  return settled
}

describe('LokiJSAdapter exclusiveLock', () => {
  it('opens the database in one tab at a time, and calls onDatabaseLockedElsewhere', async () => {
    const tab1 = openTab({ exclusiveLock: true })
    await tab1.getLocal('foo')
    expect(locks.held.has('WatermelonDB:app')).toBe(true)

    const onDatabaseLockedElsewhere = jest.fn()
    const tab2 = openTab({ exclusiveLock: true, onDatabaseLockedElsewhere })
    const tab2Ready = tab2.getLocal('foo')
    expect(await isSettled(tab2Ready)).toBe(false)
    expect(onDatabaseLockedElsewhere).toHaveBeenCalledTimes(1)

    // first tab is closed - second one opens the database
    locks.closeHolder('WatermelonDB:app')
    await tab2Ready
    await tab2.batch([['create', 'tasks', mockTaskRaw({ id: 't1' })]])
    expect(onDatabaseLockedElsewhere).toHaveBeenCalledTimes(1)
  })

  it('waits for the lock without onDatabaseLockedElsewhere', async () => {
    const tab1 = openTab({ exclusiveLock: true })
    await tab1.getLocal('foo')

    const tab2Ready = openTab({ exclusiveLock: true }).getLocal('foo')
    expect(await isSettled(tab2Ready)).toBe(false)

    locks.closeHolder('WatermelonDB:app')
    await tab2Ready
  })

  it('uses a separate lock for each database', async () => {
    await openTab({ exclusiveLock: true }).getLocal('foo')
    await openTab({ exclusiveLock: true, dbName: 'other' }).getLocal('foo')
    expect(Array.from(locks.held.keys())).toEqual(['WatermelonDB:app', 'WatermelonDB:other'])
  })

  it('stops saving and rejects changes when the lock is lost', async () => {
    const _onFatalError = jest.fn()
    const tab = openTab({ exclusiveLock: true, _onFatalError })
    await tab.batch([['create', 'tasks', mockTaskRaw({ id: 't1' })]])

    locks.steal('WatermelonDB:app')
    await sleep(0)

    expect(_onFatalError).toHaveBeenCalledTimes(1)
    expect(_onFatalError.mock.calls[0][0].name).toBe('DatabaseLockLostError')
    expect(adapters[0]._driver.loki.autosave).toBe(false)
    await expect(tab.batch([['create', 'tasks', mockTaskRaw({ id: 't2' })]])).rejects.toThrow(
      'broken',
    )
  })

  it('opens the database without a lock if Web Locks API is not available', async () => {
    const warn = jest.spyOn(logger, 'warn')
    setNavigator({})
    await openTab({ exclusiveLock: true }).getLocal('foo')
    await openTab({ exclusiveLock: true }).getLocal('foo')
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('Web Locks API'))
  })

  it('does not use locks unless enabled', async () => {
    await openTab({}).getLocal('foo')
    await openTab({}).getLocal('foo')
    expect(locks.requestCount).toBe(0)
  })
})
