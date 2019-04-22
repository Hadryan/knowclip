import electron from 'electron'

const {
  remote: { dialog },
} = electron

export const showSaveDialog = (name, extensions) =>
  new Promise((res, rej) => {
    try {
      dialog.showSaveDialog({ filters: [{ name, extensions }] }, filename => {
        res(filename)
      })
    } catch (err) {
      rej(err)
    }
  })

export const showOpenDialog = (
  filters = [],
  multiSelections = false
): Promise<?Array<string>> =>
  new Promise((res, rej) => {
    try {
      dialog.showOpenDialog(
        {
          properties: ['openFile'].concat(
            multiSelections ? 'multiSelections' : []
          ),
          filters,
        },
        filePaths => res(filePaths)
      )
    } catch (err) {
      rej(err)
    }
  })