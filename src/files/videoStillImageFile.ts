import * as r from '../redux'
import { FileEventHandlers } from './eventHandlers'
import { getMidpoint } from '../utils/getVideoStill'

export default {
  openRequest: async ({ file }, filePath, state, effects) => {
    const img = new Image()
    img.src = `file:///${filePath}`
    return await new Promise((res, rej) => {
      const onLoad = () => {
        res([r.openFileSuccess(file, filePath)])
        img.removeEventListener('load', onLoad)
      }
      const onError = (e: any) => {
        res([r.openFileFailure(file, filePath, String(e))])
        img.removeEventListener('error', onLoad)
      }
      img.addEventListener('load', onLoad)
      img.addEventListener('error', onError)
    })
  },
  openSuccess: [
    async ({ validatedFile, filePath }) => {
      return []
    },
  ],
  locateRequest: async ({ file }, availability, state, effects) => {
    try {
      const parentFile = r.getFile<MediaFile>(
        state,
        'MediaFile',
        file.mediaFileId
      )
      const parentFileAvailability = r.getFileAvailabilityById<MediaFile>(
        state,
        'MediaFile',
        file.mediaFileId
      )
      if (
        !parentFile ||
        !parentFileAvailability ||
        parentFileAvailability.status !== 'CURRENTLY_LOADED'
      )
        return [r.openFileFailure(file, null, null)]

      const cbr = r.getConstantBitrateFilePath(state, parentFile.id)
      if (!cbr)
        return [
          r.openFileFailure(
            file,
            null,
            "Can't make still image from video until it has loaded."
          ),
        ]

      const flashcard = r.getFlashcard(state, file.id)
      const clip = r.getClip(state, file.id)
      if (!flashcard)
        return [
          r.openFileFailure(
            file,
            null,
            "Can't make a still for a flashcard that doesn't exist."
          ),
        ]

      if (!clip)
        return [
          r.openFileFailure(
            file,
            null,
            "Can't make a still for a clip that doesn't exist."
          ),
        ]

      const seconds =
        flashcard.image && typeof flashcard.image.seconds === 'number'
          ? flashcard.image.seconds
          : r.getSecondsAtX(state, getMidpoint(clip.start, clip.end))

      const pngPath = await effects.getVideoStill(
        file.id,
        parentFileAvailability.filePath,
        seconds
      )
      if (pngPath.errors)
        return [
          r.openFileFailure(
            file,
            null,
            'Could not locate file: ' +
              (pngPath.errors.join('; ') ||
                'problem generating still image from media.')
          ),
        ]

      return [r.locateFileSuccess(file, pngPath.value)]
    } catch (err) {
      return [
        r.openFileFailure(
          file,
          null,
          'Problem making still image from media: ' +
            (err.message || err.toString())
        ),
      ]
    }
  },
  locateSuccess: null,
  deleteRequest: [
    async (file, availability, descendants) => [
      r.deleteFileSuccess(availability, descendants),
    ],
  ],
  deleteSuccess: [],
} as FileEventHandlers<VideoStillImageFile>
