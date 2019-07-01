// @flow
import {
  filter,
  map,
  flatMap,
  takeUntil,
  takeLast,
  take,
  switchMap,
} from 'rxjs/operators'
import { ofType } from 'redux-observable'
import { fromEvent, merge } from 'rxjs'
import * as r from '../redux'
import {
  toWaveformX,
  toWaveformCoordinates,
} from '../utils/waveformCoordinates'
import uuid from 'uuid/v4'
import newClip from '../utils/newClip'

const pendingClipIsBigEnough = state => {
  const pendingClip = r.getPendingClip(state)
  if (!pendingClip) return false

  const { start, end } = pendingClip
  return Math.abs(end - start) >= r.CLIP_THRESHOLD
}

const addClipEpic: Epic<*> = (
  action$,
  state$,
  { window, getWaveformSvgElement }
) =>
  action$.pipe(
    filter(action => action.type === 'OPEN_MEDIA_FILE_SUCCESS'),
    switchMap(() =>
      fromEvent(getWaveformSvgElement(), 'mousedown').pipe(
        map(mousedown =>
          toWaveformCoordinates(
            mousedown,
            mousedown.currentTarget,
            r.getWaveformViewBoxXMin(state$.value)
          )
        ),
        filter(
          waveformMousedown =>
            !r.getClipEdgeAt(state$.value, waveformMousedown.x)
        )
      )
    ),

    // if mousedown falls on edge of clip
    // then start stretchy epic instead of clip epic
    flatMap<{ x: number, y: number }, *, *>(waveformMousedown => {
      const mediaMetadata = r.getCurrentMediaMetadata(state$.value)
      if (!mediaMetadata) throw new Error('No current media metadata')
      const mouseups = fromEvent<*>(window, 'mouseup').pipe(take(1))
      // this should be used also in stretch epic, i guess at any reference to waveform x
      const factor =
        state$.value.waveform.stepsPerSecond * state$.value.waveform.stepLength
      const withinValidTime = x =>
        Math.max(0, Math.min(x, mediaMetadata.durationSeconds * factor))

      const svgElement = getWaveformSvgElement()
      if (!svgElement) throw new Error('Waveform disappeared')

      const pendingClips = fromEvent(window, 'mousemove').pipe(
        map<MouseEvent, SetPendingClip>(mousemove => {
          mousemove.preventDefault()
          return r.setPendingClip({
            start: withinValidTime(waveformMousedown.x), // should start be called origin instead to match with stretch thing?
            end: withinValidTime(
              toWaveformX(
                mousemove,
                svgElement,
                r.getWaveformViewBoxXMin(state$.value)
              )
            ),
          })
        }),
        takeUntil(mouseups)
      )

      const pendingClipEnds: rxjs$Observable<Action> = pendingClips.pipe(
        takeLast<*>(1),
        map<*, *>(pendingClipAction => {
          const { clip: pendingClip } = pendingClipAction
          const clipsOrder = r.getCurrentFileClipsOrder(state$.value)
          const pendingClipOverlaps = [
            r.getClipIdAt(state$.value, pendingClip.start),
            r.getClipIdAt(state$.value, pendingClip.end),
          ].some(id => clipsOrder.includes(id))
          const currentNoteType = r.getCurrentNoteType(state$.value)
          const currentFileId = r.getCurrentFileId(state$.value)
          if (!currentNoteType)
            throw new Error('Could not find current file id')
          if (!currentFileId)
            throw new Error('Could not find current note type')

          return pendingClipOverlaps || !pendingClipIsBigEnough(state$.value)
            ? // maybe later, do stretch + merge for overlaps.
              r.clearPendingClip()
            : r.addClip(
                newClip(
                  pendingClip,
                  currentFileId,
                  uuid(),
                  currentNoteType,
                  r.getDefaultTags(state$.value),
                  r.getNewFieldsFromLinkedSubtitles(state$.value, pendingClip)
                )
              )
        })
      )
      return merge(pendingClips, pendingClipEnds)
    })
  )

export default addClipEpic
