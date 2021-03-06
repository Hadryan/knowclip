import {
  flatMap,
  tap,
  map,
  catchError,
  mergeAll,
  startWith,
  endWith,
  concat,
  concatMap,
  filter,
  takeUntil,
  take,
  ignoreElements,
  switchMap,
} from 'rxjs/operators'
import { ofType, combineEpics, ActionsObservable } from 'redux-observable'
import { of, empty, defer, from } from 'rxjs'
import * as r from '../redux'
import tempy from 'tempy'
import * as anki from '@silvestre/mkanki'
import sql from 'better-sqlite3'
import { getApkgExportData } from '../utils/prepareExport'
import { showSaveDialog } from '../utils/electron'
import { areSameFile } from '../utils/files'
import * as A from '../types/ActionType'
import { processNoteMedia, AnkiNoteMedia } from '../utils/ankiNote'

const exportApkgFailure: AppEpic = action$ =>
  action$.pipe(
    ofType<Action, ExportApkgFailure>(A.EXPORT_APKG_FAILURE),
    tap(() => (document.body.style.cursor = 'default')),
    flatMap(({ errorMessage }) =>
      errorMessage
        ? of(
            r.simpleMessageSnackbar(
              `There was a problem making clips: ${errorMessage}`
            )
          )
        : empty()
    )
  )
const exportApkgSuccess: AppEpic = action$ =>
  action$.pipe(
    ofType<Action, ExportApkgSuccess>(A.EXPORT_APKG_SUCCESS),
    tap(() => (document.body.style.cursor = 'default')),
    map(({ successMessage }) => r.simpleMessageSnackbar(successMessage))
  )

const exportApkg: AppEpic = (action$, state$) =>
  action$.pipe(
    ofType<Action, ExportApkgRequest>(A.EXPORT_APKG_REQUEST),
    switchMap(exportApkgRequest => {
      const { mediaFileIdsToClipIds } = exportApkgRequest
      const directory = tempy.directory()

      const currentProject = r.getCurrentProject(state$.value)
      if (!currentProject)
        return of(r.exportApkgFailure('Could not find project'))

      const exportData = getApkgExportData(
        state$.value,
        currentProject,
        mediaFileIdsToClipIds
      )

      if ('missingMediaFiles' in exportData) {
        return getMissingMedia(
          exportData.missingMediaFiles,
          action$,
          exportApkgRequest
        )
      }

      return makeApkg(exportData, directory)
    })
  )

function makeApkg(exportData: ApkgExportData, directory: string) {
  return from(showSaveDialog('Anki APKG file', ['apkg'])).pipe(
    filter((path): path is string => Boolean(path)),
    flatMap(outputFilePath => {
      document.body.style.cursor = 'progress'
      const pkg = new anki.Package()
      const deck = new anki.Deck(exportData.projectId, exportData.deckName)
      const noteModel = new anki.Model(exportData.noteModel)
      const clozeNoteModel = new anki.ClozeModel(exportData.clozeNoteModel)

      let processed = 0

      const processClipsObservables = exportData.clips.map(
        (clipSpecs: ClipSpecs) => {
          registerClip(deck, noteModel, clozeNoteModel, clipSpecs)

          return defer(async () => {
            const noteMediaResult = await processNoteMedia(clipSpecs, directory)
            if (noteMediaResult.errors)
              throw new Error(noteMediaResult.errors.join('; '))

            const noteMedia = noteMediaResult.value
            await addNoteMedia(pkg, noteMedia)

            const number = ++processed
            return r.setProgress({
              percentage: (number / exportData.clips.length) * 100,
              message: `${number} clips out of ${
                exportData.clips.length
              } processed`,
            })
          })
        }
      )
      return of(
        r.setProgress({
          percentage: 0,
          message: 'Processing clips...',
        })
      ).pipe(
        concat(from(processClipsObservables).pipe(mergeAll(20))),
        concat(
          of(
            r.setProgress({
              percentage: 100,
              message: 'Almost done! Saving .apkg file...',
            })
          ).pipe(
            concatMap(() => {
              pkg.addDeck(deck)
              const tmpFilename = tempy.file()
              return defer(() =>
                pkg.writeToFile(outputFilePath, {
                  db: sql(tmpFilename),
                  tmpFilename,
                })
              ).pipe(
                map(() =>
                  r.exportApkgSuccess('Flashcards made in ' + outputFilePath)
                ),
                endWith(r.setProgress(null))
              )
            })
          )
        )
      )
    }),
    catchError(err => {
      console.error(err)
      return from([
        r.exportApkgFailure(err.message || err.toString()),
        r.setProgress(null),
      ])
    })
  )
}

function registerClip(
  deck: any,
  noteModel: any,
  clozeNoteModel: any,
  clipSpecs: ClipSpecs
) {
  const {
    flashcardSpecs: { fields, tags, id, clozeDeletions },
  } = clipSpecs

  const note = { fields, guid: id, tags }
  const clozeNote = clozeDeletions
    ? {
        fields: [clozeDeletions, ...fields.slice(1)],
        guid: `${id}__CLOZE`,
        tags,
      }
    : null

  deck.addNote(noteModel.note(note.fields, note.guid, note.tags))
  if (clozeNote)
    deck.addNote(
      clozeNoteModel.note(clozeNote.fields, clozeNote.guid, clozeNote.tags)
    )
}

async function addNoteMedia(pkg: any, noteMedia: AnkiNoteMedia) {
  const { soundData, imageData } = noteMedia
  pkg.addMedia(await soundData.data(), soundData.fileName)
  if (imageData) pkg.addMedia(await imageData.data(), imageData.fileName)
}

function getMissingMedia(
  missingMediaFiles: Array<MediaFile>,
  action$: ActionsObservable<Action>,
  exportApkgRequest: ExportApkgRequest
) {
  const missingMediaFileIds = missingMediaFiles.map(file => file.id)
  const openMissingMediaFailure = action$.pipe(
    ofType<Action, OpenFileFailure>('OPEN_FILE_FAILURE'),
    filter(
      a =>
        a.file.type === 'MediaFile' && missingMediaFileIds.includes(a.file.id)
    ),
    take(1)
  )
  return from(missingMediaFiles).pipe(
    concatMap(file =>
      of(r.openFileRequest(file)).pipe(
        concat(
          action$.pipe(
            ofType<Action, OpenFileSuccess>('OPEN_FILE_SUCCESS'),
            filter(a => areSameFile(file, a.validatedFile)),
            take(1),
            ignoreElements()
          )
        )
      )
    ),
    startWith(r.closeDialog()),
    takeUntil(openMissingMediaFailure),
    endWith(
      r.reviewAndExportDialog(
        exportApkgRequest.mediaOpenPrior,
        exportApkgRequest.mediaFileIdsToClipIds
      )
    )
  )
}

export default combineEpics(exportApkg, exportApkgSuccess, exportApkgFailure)
