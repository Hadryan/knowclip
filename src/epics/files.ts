import { flatMap, map, mergeAll } from 'rxjs/operators'
import { of, Observable, from, empty } from 'rxjs'
import * as r from '../redux'
import { AppEpic } from '../types/AppEpic'
import { existsSync } from 'fs'
import { combineEpics, ofType } from 'redux-observable'
import project from '../files/projectFile'
import media from '../files/mediaFile'
import temporaryVtt from '../files/temporaryVttFile'
import externalSubtitles from '../files/externalSubtitlesFile'
import waveformPng from '../files/waveformPngFile'
import constantBitrateMp3 from '../files/constantBitrateMp3File'
import { FileEventHandlers } from '../files/eventHandlers'

const addAndOpenFile: AppEpic = (action$, state$) =>
  action$.pipe(
    ofType<Action, AddAndOpenFile>(A.ADD_AND_OPEN_FILE),
    map<AddAndOpenFile, Action>(({ file }) => r.openFileRequest(file))
  )

const fileEventHandlers: Record<
  FileMetadata['type'],
  FileEventHandlers<any>
> = {
  ProjectFile: project,
  MediaFile: media,
  ExternalSubtitlesFile: externalSubtitles,
  VttConvertedSubtitlesFile: temporaryVtt,
  WaveformPng: waveformPng,
  ConstantBitrateMp3: constantBitrateMp3,
  // VideoStillImage: ,
  // },
}

const openFileRequest: AppEpic = (action$, state$, effects) =>
  action$.pipe(
    ofType<Action, OpenFileRequest>(A.OPEN_FILE_REQUEST),
    flatMap<OpenFileRequest, Observable<Action>>(action => {
      const { file } = action
      const fileAvailability = r.getFileAvailability(state$.value, file)

      if (
        !fileAvailability ||
        !fileAvailability.filePath ||
        !existsSync(fileAvailability.filePath)
      )
        return of(
          r.locateFileRequest(
            file,
            `This file "${
              'name' in file ? file.name : file.type
            }" appears to have moved or been renamed. Try locating it manually?`
          )
        )

      try {
        return from(
          fileEventHandlers[file.type].openRequest(
            action,
            fileAvailability.filePath,
            state$.value,
            effects
          )
        ).pipe(mergeAll())
      } catch (err) {
        return of(
          r.openFileFailure(
            file,
            fileAvailability ? fileAvailability.filePath : null,
            err.message || err.toString()
          )
        )
      }
    })
  )

const openFileSuccess: AppEpic = (action$, state$, effects) =>
  action$.pipe(
    ofType<Action, OpenFileSuccess>(A.OPEN_FILE_SUCCESS),
    flatMap(action =>
      from(
        fileEventHandlers[action.validatedFile.type].openSuccess.map(handler =>
          from(handler(action, state$.value, effects)).pipe(mergeAll())
        )
      )
    ),
    mergeAll()
  )

const openFileFailure: AppEpic = (action$, state$, effects) =>
  action$.pipe(
    ofType<Action, OpenFileFailure>(A.OPEN_FILE_FAILURE),
    flatMap<OpenFileFailure, Observable<Action>>(
      ({ file, filePath, errorMessage }) => {
        // const hook = fileEventHandlers[file.type].openFailure

        // if (hook)
        //   return hook(file, filePath, errorMessage, state$.value, effects)

        return of(
          r.simpleMessageSnackbar('Could not load file: ' + errorMessage)
        )
      }
    )
  )

const flatten = (asyncArray: Promise<Action[]>) =>
  from(asyncArray).pipe(flatMap(array => from(array)))

const locateFileRequest: AppEpic = (action$, state$, effects) =>
  action$.pipe(
    ofType<Action, LocateFileRequest>(A.LOCATE_FILE_REQUEST),
    flatMap<LocateFileRequest, Observable<Action>>(action =>
      flatten(
        fileEventHandlers[action.file.type].locateRequest(
          action,
          state$.value,
          effects
        )
      )
    )
  )

const locateFileSuccess: AppEpic = (action$, state$, effects) =>
  action$.pipe(
    ofType<Action, LocateFileSuccess>(A.LOCATE_FILE_SUCCESS),
    map<LocateFileSuccess, Action>(({ file, filePath }) =>
      r.openFileRequest(file)
    )
  )

const deleteFileRequest: AppEpic = (action$, state$, effects) =>
  action$.pipe(
    ofType<Action, DeleteFileRequest>(A.DELETE_FILE_REQUEST),
    flatMap(({ fileType, id }) => {
      const file = r.getFile(state$.value, fileType, id)

      // return file
      //   ? from(
      //       fileEventHandlers[fileType].deleteRequest.map(handler =>
      //         from(handler(file, state$.value, effects)).pipe(mergeAll())
      //       )
      //     )
      //   : empty

      return file
        ? from(
            fileEventHandlers[fileType].deleteRequest.flatMap(handler =>
              from(handler(file, state$.value, effects)).pipe(mergeAll())
            )
          )
        : empty()
    }),
    mergeAll()
  )

const deleteFileSuccess: AppEpic = (action$, state$, effects) =>
  action$.pipe(
    ofType<Action, DeleteFileSuccess>(A.DELETE_FILE_SUCCESS),
    flatMap(action =>
      from(
        fileEventHandlers[action.file.type].deleteSuccess.flatMap(handler =>
          from(handler(action, state$.value, effects)).pipe(mergeAll())
        )
      )
    ),
    mergeAll()
  )
export default combineEpics(
  addAndOpenFile,
  openFileRequest,
  openFileSuccess,
  openFileFailure,
  locateFileRequest,
  locateFileSuccess,
  deleteFileRequest,
  deleteFileSuccess
)
