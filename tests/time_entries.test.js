'use strict';
const TogglClient = require('../');
require('dotenv').config()

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

describe('Testing Time Entries', () => {
  let togglClient
  const workspaceId = Number(process.env.WORKSPACE_ID)
  const newTimeEntry = {
    description: 'Test entry',
    workspace_id: workspaceId,
    duration: -1,
    start: new Date(Date.now()),
    stop: null
  }

  beforeEach(() => {
    togglClient = new TogglClient({ apiToken: process.env.API_TOKEN });
  });

  afterEach(() => {
    togglClient.destroy();
  });


  it('should start a new time entry', async () => {
    const timeEntry = await togglClient.startTimeEntry(newTimeEntry)
    expect(timeEntry).toHaveProperty('id');
  })

  it('should CREATE a new time entry', async () => {
    const timeEntry = await togglClient.createTimeEntry(newTimeEntry)
    expect(timeEntry).toHaveProperty('id');
  })

  it('should start a new time entry (with callback)', done => {
    togglClient.startTimeEntry(newTimeEntry,
      (err, timeEntry) => {
        if (err) {
          return done(err);
        }

        expect(timeEntry).toHaveProperty('id');
        return done();
      })
  })

  it('should start a new time entry, edit it, stop it, delete it', async () => {
    const timeEntry = await togglClient.startTimeEntry(newTimeEntry)
    expect(timeEntry).toHaveProperty('id');


    const dataToUpdate = {
      description: 'Test entry updated',
      workspace_id: workspaceId,
      id: timeEntry.id
    }

    await togglClient.updateTimeEntry(workspaceId, timeEntry.id, dataToUpdate)
    const updatedEntry = await togglClient.getTimeEntryData(timeEntry.id)
    expect(updatedEntry.description).toBe('Test entry updated')

    const currentTimeEntry = await togglClient.getCurrentTimeEntry()
    expect(currentTimeEntry.id).toBe(updatedEntry.id)

    await sleep(3_000)

    const stoppedEntry = await togglClient.stopTimeEntry(workspaceId, timeEntry.id)
    const duration = -stoppedEntry.duration + Date.now() / 1_000
    expect(duration).toBeGreaterThan(2);

    const deletedEntry = await togglClient.deleteTimeEntry(workspaceId, timeEntry.id)
    expect(deletedEntry).toBeUndefined()
  })

  it('should start 2 new time entry, edit it in BULK, stop it', async () => {
    const timeEntry1 = await togglClient.startTimeEntry(newTimeEntry)
    expect(timeEntry1).toHaveProperty('id');
    const timeEntry2 = await togglClient.startTimeEntry(newTimeEntry)
    expect(timeEntry2).toHaveProperty('id');

    const dataToUpdate = [
      {
        "op": "replace",
        "path": "/description",
        "value": "Test entry updated 123"
      }
    ]

    await togglClient.updateTimeEntries(workspaceId, [timeEntry1.id, timeEntry2.id], dataToUpdate)

    const updatedEntry1 = await togglClient.getTimeEntryData(timeEntry1.id)
    expect(updatedEntry1.description).toBe('Test entry updated 123')
    const updatedEntry2 = await togglClient.getTimeEntryData(timeEntry2.id)
    expect(updatedEntry2.description).toBe('Test entry updated 123')

    const deletedEntry1 = await togglClient.deleteTimeEntry(workspaceId, timeEntry1.id)
    expect(deletedEntry1).toBeUndefined()
    const deletedEntry2 = await togglClient.deleteTimeEntry(workspaceId, timeEntry2.id)
    expect(deletedEntry2).toBeUndefined()
  })

  it('should get time entries', async () => {
    const timeEntries = await togglClient.getTimeEntries()
    expect(timeEntries).toBeInstanceOf(Array)
  })


  it('should get time entries with starting and ending dates', async () => {
    const timeEntries = await togglClient.getTimeEntries(
      '2024-03-25T11:36:00+00:00',
      '2024-05-25T15:36:00+00:00'
    )
    expect(timeEntries).toBeInstanceOf(Array)
  })


  it('should add, edit and remote tag entry tags', async () => {
    const timeEntry = await togglClient.startTimeEntry(newTimeEntry)
    expect(timeEntry).toHaveProperty('id');

    const tags = ['tag1', 'tag2']
    await togglClient.addTimeEntryTags(workspaceId, timeEntry.id, tags)

    await sleep(300)

    const timeEntryData = await togglClient.getTimeEntryData(timeEntry.id)
    expect(timeEntryData.tags).toEqual(tags)

    await togglClient.removeTimeEntryTags(workspaceId, timeEntry.id, tags)

    await sleep(300)

    const timeEntryData2 = await togglClient.getTimeEntryData(timeEntry.id)
    expect(timeEntryData2.tags).toEqual([])

  })
});

