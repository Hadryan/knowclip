import { filter, map, ignoreElements, tap, flatMap } from 'rxjs/operators'
import { combineEpics } from 'redux-observable'
import { fromEvent, empty, of } from 'rxjs'
import * as r from '../redux'
import { AppEpic } from '../types/AppEpic'
import { showMessageBox, showOpenDialog } from '../utils/electron'
import electron, { shell } from 'electron'
import icon from '../icon.png'
import { join } from 'path'

const showSettingsDialog: AppEpic = (action$, state$, { ipcRenderer }) =>
  fromEvent(ipcRenderer, 'show-settings-dialog').pipe(
    filter(() => !state$.value.dialog.queue.some(d => d.type === 'Settings')),
    map(() => r.settingsDialog())
  )

const aboutMessage = [
  `Version ${electron.remote.app.getVersion()}`,
  `Build #${process.env.REACT_APP_TRAVIS_BUILD_NUMBER || '[DEV BUILD]'}`,
  'Distributed under GNU General Public License 3.0.',
  '© 2020 Justin Silvestre',
].join('\n\n')

const showAboutDialog: AppEpic = (action$, state$, { ipcRenderer }) =>
  fromEvent(ipcRenderer, 'show-about-dialog').pipe(
    flatMap(() =>
      showMessageBox({
        type: 'info',
        icon: electron.remote.nativeImage.createFromPath(
          join(electron.remote.process.cwd(), 'icons', 'icon.png')
        ),
        title: 'Knowclip v' + electron.remote.app.getVersion(),
        message: aboutMessage,
        buttons: ['OK', 'Go to website'],
      })
    ),
    tap(messageBoxReturnValue => {
      if (messageBoxReturnValue) {
        if (messageBoxReturnValue.response === 1)
          shell.openExternal('http://knowclip.com')
      }
    }),
    ignoreElements()
  )

const saveProject: AppEpic = (action$, state$, { ipcRenderer }) =>
  fromEvent(ipcRenderer, 'save-project').pipe(map(() => r.saveProjectRequest()))

const closeProject: AppEpic = (action$, state$, { ipcRenderer }) =>
  fromEvent(ipcRenderer, 'close-project').pipe(
    map(() => r.closeProjectRequest())
  )

const openProject: AppEpic = (action$, state$, { ipcRenderer }) =>
  fromEvent(ipcRenderer, 'open-project').pipe(
    flatMap(
      async () =>
        await showOpenDialog([
          {
            name: 'Knowclip project file',
            extensions: ['kyml'],
          },
        ])
    ),

    flatMap(filePaths => {
      if (!filePaths) return empty()

      const filePath = filePaths[0]
      return of(r.openProjectByFilePath(filePath))
    })
  )

const checkForLinuxUpdates: AppEpic = (action$, state$, { ipcRenderer }) =>
  fromEvent(ipcRenderer, 'manual-check-for-updates').pipe(
    tap(() =>
      electron.shell.openExternal(
        'https://github.com/knowclip/knowclip/releases'
      )
    ),
    ignoreElements()
  )

export default combineEpics(
  showSettingsDialog,
  showAboutDialog,
  saveProject,
  closeProject,
  openProject,
  checkForLinuxUpdates
)
