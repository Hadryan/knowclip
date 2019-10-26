import moment from 'moment'
import getAllTags from '../utils/getAllTags'
import { getClips, getPreviouslyLoadedFile } from '.'
import { getMediaFiles, getProjectMediaFileRecords } from './media'
import { getFileRecord } from './files'

export const getProject = (
  state: AppState,
  projectMetadata: ProjectMetadata
): Project4_1_0 => ({
  version: '4.1.0',
  timestamp: moment.utc().format(),
  name: projectMetadata.name,
  id: projectMetadata.id,
  noteType: projectMetadata.noteType,
  mediaFiles: getProjectMediaFileRecords(state, projectMetadata.id),
  tags: [...getAllTags(state.clips.byId)],
  clips: getProjectMediaFileRecords(state, projectMetadata.id).reduce(
    (clips, { id }) => [...clips, ...getClips(state, id)],
    [] as Clip[]
  ),
  subtitles: [],
})

export const getProjects = (state: AppState): Array<ProjectMetadata> =>
  state.projects.allIds.map(id => state.projects.byId[id])

export const getProjectIdByFilePath = (
  state: AppState,
  filePath: MediaFilePath
): ProjectId | null =>
  state.projects.allIds.find(
    id => state.projects.byId[id].filePath === filePath
  ) || null

export const getProjectMetadata = (
  state: AppState,
  id: ProjectId
): ProjectMetadata | null => state.projects.byId[id] || null

export const getCurrentProjectId = (state: AppState): ProjectId | null =>
  state.user.currentProjectId

export const getCurrentProject = (state: AppState): ProjectMetadata | null => {
  const currentProjectId = getCurrentProjectId(state)
  return currentProjectId ? state.projects.byId[currentProjectId] : null
}

export const getMediaMetadataFromCurrentProject = (
  state: AppState,
  id: MediaFileId
): MediaFileMetadata | null => state.media.byId[id].metadata || null

export const getMediaFilePathFromCurrentProject = (
  state: AppState,
  id: MediaFileId
): MediaFilePath | null =>
  state.media.byId[id] ? state.media.byId[id].filePath : null

export const getMediaFileConstantBitratePathFromCurrentProject = (
  state: AppState,
  id: MediaFileId
): MediaFilePath | null =>
  // state.media.byId[id] ? state.media.byId[id].constantBitrateFilePath : null
  {
    const fileRecord: FileRecord | null = id
      ? state.fileRecords.MediaFile[id]
      : null
    const loadedFile = fileRecord
      ? getPreviouslyLoadedFile(state, fileRecord)
      : null
    return loadedFile && loadedFile.status === 'CURRENTLY_LOADED'
      ? loadedFile.filePath
      : null
  }
export const getCurrentFilePath = (state: AppState): MediaFilePath | null => {
  const currentFileId = state.user.currentMediaFileId
  const currentFileRecord: FileRecord | null = currentFileId
    ? state.fileRecords.MediaFile[currentFileId]
    : null
  const currentFile = currentFileRecord
    ? getPreviouslyLoadedFile(state, currentFileRecord)
    : null
  return currentFile && currentFile.status === 'CURRENTLY_LOADED'
    ? currentFile.filePath
    : null

  // return currentFileId
  // ? getMediaFilePathFromCurrentProject(state, currentFileId)
  // : null
}

export const getCurrentMediaFileConstantBitratePath = (
  state: AppState
): MediaFilePath | null => getCurrentFilePath(state)
// state.user.currentMediaFileId
//   ? getMediaFileConstantBitratePathFromCurrentProject(
//       state,
//       state.user.currentMediaFileId
//     )
//   : null

export const getProjectMediaMetadata = (
  // rename to just media files
  state: AppState,
  projectId: ProjectId
): Array<MediaFileMetadata> =>
  getMediaFiles(state, projectId).map(({ metadata }) => metadata)

export const getCurrentMediaFile = (state: AppState): MediaFile | null => {
  // remove
  const { currentMediaFileId } = state.user
  return currentMediaFileId ? state.media.byId[currentMediaFileId] : null
}

export const getCurrentMediaMetadata = (
  // remove
  state: AppState
): MediaFileMetadata | null => {
  const currentMediaFile = getCurrentMediaFile(state)
  return currentMediaFile ? currentMediaFile.metadata : null
}

export const getCurrentMediaFileRecord = (
  state: AppState
): MediaFileRecord | null => {
  const { currentMediaFileId } = state.user
  return currentMediaFileId
    ? getFileRecord(state, 'MediaFile', currentMediaFileId)
    : null
}

export const isWorkUnsaved = (state: AppState): boolean =>
  state.user.workIsUnsaved
