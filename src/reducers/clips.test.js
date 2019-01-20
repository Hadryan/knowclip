// @flow
import clips from './clips'
import newClip from '../utils/newClip'
import * as r from '../redux'

describe('clips reducer', () => {
  const filePath = 'filePath'
  const noteType: NoteType = {
    name: 'default',
    id: 'default',
    fields: [{ id: 'asdf', name: 'Front' }, { id: 'dfjk', name: 'Back' }],
  }
  const oldState: ClipsState = clips(
    {
      byId: {
        a: newClip({ start: 1, end: 1.5 }, filePath, 'a', noteType),
        b: newClip({ start: 2, end: 2.5 }, filePath, 'b', noteType),
        c: newClip({ start: 3, end: 3.5 }, filePath, 'c', noteType),
      },
      idsByFilePath: {
        [filePath]: ['a', 'b', 'c'],
      },
    },
    { type: '@@INIT' }
  )

  it('adds to byId and idsByFilepath during ADD_WAVEFORM_SELECTION', () => {
    const clip = newClip({ start: 2.75, end: 3 }, filePath, 'b-c', noteType)
    const action = r.addWaveformSelection(clip)
    const newState = clips(oldState, action)
    expect(newState.idsByFilePath[filePath]).toEqual(['a', 'b', 'b-c', 'c'])
    expect(newState.byId).toEqual({
      ...oldState.byId,
      [clip.id]: clip,
    })
  })

  it('adds to byId and idsByFilepath during ADD_WAVEFORM_SELECTION', () => {
    const clip = newClip({ start: 4, end: 4.5 }, filePath, 'd', noteType)
    const action = r.addWaveformSelection(clip)
    const newState = clips(oldState, action)
    expect(newState.idsByFilePath[filePath]).toEqual(['a', 'b', 'c', 'd'])
    expect(newState.byId).toEqual({
      ...oldState.byId,
      [clip.id]: clip,
    })
  })

  it('adds to byId and idsByFilepath during ADD_WAVEFORM_SELECTIONS', () => {
    const bC1 = newClip({ start: 2.75, end: 2.8 }, filePath, 'b-c1', noteType)
    const bC2 = newClip({ start: 2.85, end: 3 }, filePath, 'b-c2', noteType)

    const newClips = [bC1, bC2]
    const action = r.addWaveformSelections(newClips, filePath)
    const newState = clips(oldState, action)
    expect(newState.idsByFilePath[filePath]).toEqual([
      'a',
      'b',
      'b-c1',
      'b-c2',
      'c',
    ])
    expect(newState.byId).toEqual({
      ...oldState.byId,
      'b-c1': bC1,
      'b-c2': bC2,
    })
  })
})
