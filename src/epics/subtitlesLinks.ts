import { combineEpics } from 'redux-observable'
import { flatMap, map } from 'rxjs/operators'
import { of, empty, from } from 'rxjs'
import * as r from '../redux'
import { TransliterationFlashcardFields } from '../types/Project'
import { uuid } from '../utils/sideEffects'

const linkFieldToTrackRequest: AppEpic = (action$, state$) =>
  action$
    .ofType<LinkFlashcardFieldToSubtitlesTrackRequest>(
      A.LINK_FLASHCARD_FIELD_TO_SUBTITLES_TRACK_REQUEST
    )
    .pipe(
      map<LinkFlashcardFieldToSubtitlesTrackRequest, Action>(
        ({ mediaFileId, flashcardFieldName, subtitlesTrackId }) => {
          const previousLinks = r.getSubtitlesFlashcardFieldLinks(state$.value)
          const previouslyLinkedField = (Object.keys(
            previousLinks
          ) as FlashcardFieldName[]).find(fn => {
            const fieldName = fn as TransliterationFlashcardFieldName
            return previousLinks[fieldName] === subtitlesTrackId
          })
          const cards = r.getFlashcards(state$.value, mediaFileId)
          if (!cards.length)
            return r.linkFlashcardFieldToSubtitlesTrack(
              flashcardFieldName,
              mediaFileId,
              subtitlesTrackId
            )

          const actions: string[] = []
          const unlinking = !subtitlesTrackId
          if (previouslyLinkedField || unlinking) {
            actions.push(
              `clear the ${previouslyLinkedField || flashcardFieldName} field`
            )
          }
          if (!unlinking) {
            actions.push(`overwrite the ${flashcardFieldName} field`)
          }

          const message =
            "It looks like you've already made some flashcards from this media file." +
            '\n\n' +
            `This action will ${actions.join(
              ' and '
            )} for all these existing cards.` +
            '\n\n' +
            'Is that OK?'

          return r.confirmationDialog(
            message,
            r.linkFlashcardFieldToSubtitlesTrack(
              flashcardFieldName,
              mediaFileId,
              subtitlesTrackId,
              previouslyLinkedField
            )
          )
        }
      )
    )

const linkFieldToTrack: AppEpic = (action$, state$) =>
  action$
    .ofType<LinkFlashcardFieldToSubtitlesTrack>(
      A.LINK_FLASHCARD_FIELD_TO_SUBTITLES_TRACK
    )
    .pipe(
      flatMap(action => {
        const currentNoteType = r.getCurrentNoteType(state$.value)
        if (!currentNoteType) return empty()

        const edits: EditClips['edits'] = []

        for (const clip of r.getClips(state$.value, action.mediaFileId)) {
          const {
            [action.flashcardFieldName]: newValue,
          } = r.getNewFieldsFromLinkedSubtitles(
            state$.value,
            currentNoteType,
            clip
          ) as TransliterationFlashcardFields

          const newFields = { [action.flashcardFieldName]: newValue.trim() }
          if (action.fieldToClear) newFields[action.fieldToClear] = ''

          edits.push({
            id: clip.id,
            flashcardOverride: { fields: newFields },
            override: null,
          })
        }

        return of(r.editClips(edits))
      })
    )

export const newClipFromChunk: AppEpic = (
  action$,
  state$,
  { setCurrentTime }
) =>
  action$.ofType<StartEditingCards>(A.START_EDITING_CARDS).pipe(
    flatMap(() => {
      const selection = r.getWaveformSelection(state$.value)
      if (selection && selection.type === 'Preview') {
        const mediaFileId = r.getCurrentFileId(state$.value)
        if (!mediaFileId) return empty()
        const cardBases = r.getSubtitlesCardBases(state$.value)
        const fieldsToTracks = r.getSubtitlesFlashcardFieldLinks(state$.value)
        const tracksToFieldsText = cardBases.getFieldsPreviewFromCardsBase(
          cardBases.cards[selection.index]
        )
        const fields = {} as TransliterationFlashcardFields
        for (const fieldName of cardBases.fieldNames) {
          const trackId = fieldsToTracks[fieldName]
          const text = trackId && tracksToFieldsText[trackId]
          fields[fieldName] = text || ''
        }
        const { clip, flashcard } = r.getNewClipAndCard(
          state$.value,
          { start: selection.item.start, end: selection.item.end },
          mediaFileId,
          uuid(),
          fields
        )

        setCurrentTime(r.getSecondsAtX(state$.value, selection.item.start))

        return from([r.addClip(clip, flashcard, true)])
      }
      return empty()
    })
  )

export default combineEpics(
  linkFieldToTrackRequest,
  linkFieldToTrack,
  newClipFromChunk
)
