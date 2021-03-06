import { Application } from 'spectron'

export default async function runEvents(
  app: Application,
  [next, ...rest]: any[]
) {
  if (next) {
    await app.webContents.sendInputEvent(next)
    await runEvents(app, rest)
  }
}

export async function dragMouse(
  app: Application,
  start: [number, number],
  end: [number, number]
) {
  try {
    const mouseDragEvents = getMouseDragEvents(start, end)
    await runEvents(app, mouseDragEvents)
  } catch (err) {
    const [x1, y1] = start
    const [x2, y2] = end
    throw new Error(
      `Could not drag mouse from [${x1}, ${y1}] to [${x2}, ${y2}]: ${
        err.message
      }`
    )
  }
}

export async function clickAt(app: Application, [x, y]: [number, number]) {
  try {
    await runEvents(app, [
      {
        type: 'mouseDown',
        x,
        y,
      },
      {
        type: 'mouseMove',
        x,
        y,
      },
      {
        type: 'mouseUp',
        x,
        y,
      },
    ])
  } catch (err) {
    throw new Error(`Could not click mouse at [${x}, ${y}]: ${err.message}`)
  }
}

function getMouseDragEvents(
  [fromX, fromY]: [number, number],
  [toX, toY]: [number, number]
) {
  return [
    {
      type: 'mouseDown',
      x: fromX,
      y: fromY,
    },
    {
      type: 'mouseMove',
      x: ~~((toX + fromX) / 2),
      y: ~~((toY + fromY) / 2),
    },
    {
      type: 'mouseMove',
      x: toX,
      y: toY,
    },
    {
      type: 'mouseUp',
      x: toX,
      y: toY,
    },
  ]
}
