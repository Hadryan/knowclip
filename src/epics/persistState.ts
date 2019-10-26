import { ignoreElements, tap } from 'rxjs/operators'
import { ofType } from 'redux-observable'
import { AppEpic } from '../types/AppEpic'

const persistStateEpic: AppEpic = (action$, state$, { setLocalStorage }) =>
  action$.pipe(
    ofType(
      A.OPEN_PROJECT,
      A.ADD_MEDIA_TO_PROJECT,
      A.DELETE_MEDIA_FROM_PROJECT,
      A.LOCATE_MEDIA_FILE_SUCCESS,
      A.SET_MEDIA_FOLDER_LOCATION,
      A.LOAD_FILE_SUCCESS
    ),
    tap(() => {
      setLocalStorage('projects', JSON.stringify(state$.value.projects))
      setLocalStorage('media', JSON.stringify(state$.value.media))
      setLocalStorage('settings', JSON.stringify(state$.value.settings))
      setLocalStorage('loadedFiles', JSON.stringify(state$.value.loadedFiles))
      setLocalStorage('fileRecords', JSON.stringify(state$.value.fileRecords))
    }),
    ignoreElements()
  )

export default persistStateEpic
