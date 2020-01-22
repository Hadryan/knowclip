import { Application } from 'spectron'
import {
  startApp,
  stopApp,
  TestSetup,
  TMP_DIRECTORY,
  FIXTURES_DIRECTORY,
  ASSETS_DIRECTORY,
  GENERATED_ASSETS_DIRECTORY,
} from '../../spectronApp'
import { mkdirp, remove, existsSync, copy } from 'fs-extra'
import { mockSideEffects } from '../../../utils/sideEffects'
import openSharedProject from './openSharedProject'
import navigateBetweenMedia from './navigateBetweenMedia'
import makeFlashcardsWithSubtitles from './makeFlashcardsWithSubtitles'
import manuallyLocateAsset from './manuallyLocateAsset'
import { join } from 'path'
import { mockElectronHelpers } from '../../../utils/electron/mocks'

jest.setTimeout(60000)

describe('opening a shared project', () => {
  let context: { app: Application | null } = { app: null }
  let setup: TestSetup

  beforeAll(async () => {
    setup = await startApp(context, 'sharedProject')

    // await mockSideEffects(setup.app,{})
  })

  test('open a shared project and locates media in local filesystem', () =>
    openSharedProject(setup))
  test('navigate between as-of-yet unloaded media', () =>
    navigateBetweenMedia(setup))
  test('make some flashcards', () => makeFlashcardsWithSubtitles(setup))
  test('manually locate missing assets', () => manuallyLocateAsset(setup))
  // test('review and export deck with missing media', () =>
  //   reviewAndExportApkg(setup))
  // test('save and close project', () => saveAndCloseProject(setup))

  afterAll(async () => {
    if (context.app)
      await mockElectronHelpers(context.app, {
        showMessageBox: [
          Promise.resolve({
            response: 0,
            checkboxChecked: false,
          }),
        ],
      })
    await stopApp(context)
  })
})
