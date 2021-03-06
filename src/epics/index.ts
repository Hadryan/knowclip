import { ignoreElements, mergeAll, tap } from 'rxjs/operators'
import { combineEpics } from 'redux-observable'
import { fromEvent, of } from 'rxjs'
import * as A from '../types/ActionType'
import * as r from '../redux'
import setWaveformCursorEpic from './setWaveformCursor'
import addClip from './addClip'
import stretchClip from './stretchClip'
import editClip from './editClip'
import detectSilenceEpic from './detectSilence'
import exportCsvAndMp3 from './exportCsvAndMp3'
import exportMarkdown from './exportMarkdown'
import exportApkg from './exportApkg'
import addMediaToProject from './addMediaToProject'
import deleteAllCurrentFileClips from './deleteAllCurrentFileClips'
import keyboard from './keyboard'
import project from './project'
import highlightClip from './highlightClip'
import subtitles from './subtitles'
import subtitlesLinks from './subtitlesLinks'
import files from './files'
import defaultTags from './defaultTags'
import loopMedia from './loopMedia'
import preloadVideoStills from './preloadVideoStills'
import generateWaveformImages from './generateWaveformImages'
import menu from './menu'
import { showMessageBox } from '../utils/electron'

const closeEpic: AppEpic = (action$, state$, { ipcRenderer }) =>
  fromEvent(ipcRenderer, 'app-close', async () => {
    if (!r.getCurrentProject(state$.value) || !r.isWorkUnsaved(state$.value)) {
      ipcRenderer.send('closed')
      return await { type: 'QUIT_APP' }
    }

    const choice = await showMessageBox({
      type: 'question',
      buttons: ['Cancel', 'Quit'],
      title: 'Confirm',
      message: 'Are you sure you want to quit without saving your work?',
    })
    if (!choice || choice.response === 0) {
      // e.preventDefault()
      return await { type: "DON'T QUIT ON ME!!" }
    } else {
      ipcRenderer.send('closed')
      return await { type: 'QUIT_APP' }
    }
  }).pipe(
    mergeAll(),
    ignoreElements()
  )

const initialize: AppEpic = () => of(r.initializeApp())

const pauseOnBusy: AppEpic = (action$, state$, { pauseMedia }) =>
  action$.ofType(A.SET_PROGRESS, A.ENQUEUE_DIALOG).pipe(
    tap(() => pauseMedia()),
    ignoreElements()
  )

const rootEpic: AppEpic = combineEpics(
  initialize,
  addMediaToProject,
  setWaveformCursorEpic,
  loopMedia,
  addClip,
  editClip,
  stretchClip,
  detectSilenceEpic,
  exportCsvAndMp3,
  exportApkg,
  exportMarkdown,
  deleteAllCurrentFileClips,
  project,
  defaultTags,
  keyboard,
  highlightClip,
  closeEpic,
  subtitles,
  subtitlesLinks,
  files,
  preloadVideoStills,
  generateWaveformImages,
  menu,
  pauseOnBusy
)

export default rootEpic
