import { Application } from 'spectron'
import electron from 'electron'
import { join } from 'path'
import { ClientWrapper } from './driver'

export const TMP_DIRECTORY = join(process.cwd(), 'tmp-test')
export const MEDIA_DIRECTORY = join(__dirname, 'media')
export const FIXTURES_DIRECTORY = join(__dirname, 'fixtures')

export type TestSetup = {
  app: Application
  clientWrapper: ClientWrapper
}

export async function startApp(
  context: {
    app: Application | null
  },
  testId: string
): Promise<TestSetup> {
  const app = new Application({
    chromeDriverArgs: ['--disable-extensions', '--debug'],
    webdriverOptions: { deprecationWarnings: false },
    path: (electron as unknown) as string,
    env: {
      NODE_ENV: 'test',
      SPECTRON: Boolean(process.env.REACT_APP_SPECTRON),
      INTEGRATION_DEV: Boolean(process.env.INTEGRATION_DEV),
    },
    args: [join(__dirname, '..', '..')],
  })
  context.app = app

  await app.start()

  const setup = {
    app,
    clientWrapper: new ClientWrapper(app.client),
  }
  return setup
}

export async function stopApp(context: {
  app: Application | null
}): Promise<null> {
  const { app } = context
  if (app) {
    await app.stop()
  }

  if (app && app.isRunning()) app.mainProcess.exit(0)

  context.app = null

  return null
}
