import Dexie, { type Table } from 'dexie'
import type { CostedEvent } from '../domain/types'

class RawDb extends Dexie {
  events!: Table<CostedEvent & { id?: number }, number>
  constructor() {
    super('cc-dashboard-raw')
    this.version(1).stores({ events: '++id, sessionId, project, model' })
  }
}

const db = new RawDb()

export async function saveEvents(events: CostedEvent[]): Promise<void> {
  await db.transaction('rw', db.events, async () => {
    await db.events.clear()
    await db.events.bulkPut(events)
  })
}

export async function eventsBySession(sessionId: string): Promise<CostedEvent[]> {
  return db.events.where('sessionId').equals(sessionId).toArray()
}

export async function clearEvents(): Promise<void> {
  await db.events.clear()
}

export async function allEvents(): Promise<CostedEvent[]> {
  return db.events.toArray()
}
