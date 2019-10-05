import { fromEvent, Observable, of, empty } from 'rxjs'
import { map, flatMap, takeWhile, startWith } from 'rxjs/operators'
import { Epic, ofType } from 'redux-observable'
import { setWaveformCursor } from '../actions'
import * as r from '../redux'

const setWaveformCursorEpic: Epic<
  Action,
  Action,
  AppState,
  EpicsDependencies
> = (
  action$,
  state$,
  { document, getWaveformSvgWidth, setCurrentTime, getCurrentTime }
) =>
  action$.pipe(
    ofType<Action, OpenMediaFileSuccess>('OPEN_MEDIA_FILE_SUCCESS'),
    flatMap<OpenMediaFileSuccess, Observable<Action>>(() =>
      fromEvent<Event>(
        document,
        'timeupdate',
        // @ts-ignore
        true
      ).pipe(
        // takeUntil(
        // merge(
        //   action$.pipe(
        //     ofType('CLOSE_PROJECT', 'OPEN_MEDIA_FILE_REQUEST' /* CLOSE_MEDIA_FILE */),
        //   ),
        //   action$.pipe(
        //     ofType('DELETE_MEDIA_FROM_PROJECT'),
        //     withLatestFrom('OPEN_MEDIA_FILE_SUCCESS'),
        //     filter(([deleteMedia, openMediaFileSuccess]) => deleteMedia.mediaFileId === openMediaFileSuccess.id)
        //   )
        // ),
        // ),
        takeWhile(() =>
          Boolean(r.getCurrentMediaFileConstantBitratePath(state$.value))
        ),
        map(() => {
          const viewBox = state$.value.waveform.viewBox

          const highlightedId = r.getHighlightedClipId(state$.value)
          const highlightedClip =
            highlightedId && r.getClip(state$.value, highlightedId)
          const timeToLoop =
            highlightedClip &&
            r.isLoopOn(state$.value) &&
            getCurrentTime() >=
              r.getSecondsAtX(state$.value, highlightedClip.end)
          if (highlightedClip && timeToLoop) {
            setCurrentTime(r.getSecondsAtX(state$.value, highlightedClip.start))
          }

          const newX = Math.round(
            highlightedClip && timeToLoop
              ? highlightedClip.start
              : getCurrentTime() * 50
          )
          // if (!svgElement) return { type: 'WHOOPS CaNT UPDATE CURSOR NOW' }
          const svgWidth = getWaveformSvgWidth()
          if (newX < viewBox.xMin) {
            return setWaveformCursor(newX, {
              ...viewBox,
              xMin: Math.max(0, newX - svgWidth * 0.9),
            })
          }
          if (newX > svgWidth + viewBox.xMin) {
            return setWaveformCursor(newX, { ...viewBox, xMin: newX })
          }
          return setWaveformCursor(newX)
        }),
        startWith(setWaveformCursor(0, { xMin: 0 }))
      )
    )
  )

export default setWaveformCursorEpic