// declare type FileRecordsState = {
//   // byId: Record<FileId, FileRecord>
//   idsByBaseFileId: Record<ParentFileId, Array<FileId>>
//   byType: Record<FileRecord['type'], Record<FileId, FileRecord>>
// }
declare type FileRecordsState = {
  ProjectFile: Record<FileId, ProjectFileRecord>
  MediaFile: Record<FileId, MediaFileRecord>
  TemporaryVttFile: Record<FileId, TemporaryVttFileRecord>
  ExternalSubtitlesFile: Record<FileId, ExternalSubtitlesFileRecord>
  WaveformPng: Record<FileId, WaveformPngRecord>
  ConstantBitrateMp3: Record<FileId, ConstantBitrateMp3Record>
  // VideoStillImage: Record<FileId, VideoStillImageRecord>
}

declare type FileId = string
declare type FilePath = string

declare type ParentFileId = string

// parent can be a file or any entity, to trigger
// loadedfile's deletion on deleted/removed from state

//maybe have a onNotFound: Action field?
declare type FilePath = string

declare type FileRecord =
  | ProjectFileRecord
  | MediaFileRecord
  | ExternalSubtitlesFileRecord
  | TemporaryVttFileRecord
  | WaveformPngRecord
  | ConstantBitrateMp3Record
// | VideoStillImageRecord

declare type ProjectFileRecord = {
  type: 'ProjectFile'
  id: FileId
  name: string
  noteType: NoteType
  mediaFiles: Array<MediaFileId>
  // sbutitles: Array<Sbtsdfjsid>
  error: string | null
  lastOpened: string
  lastSaved: string
}
declare type MediaFileRecord = {
  type: 'MediaFile'
  id: FileId
  parentId: ProjectId

  subtitles: Array<SubtitlesTrackId>
  flashcardFieldsToSubtitlesTracks: SubtitlesFlashcardFieldsLinks

  name: MediaFileName
  durationSeconds: number
  format: 'UNKNOWN' | string
  isVideo: boolean
  subtitlesTracksStreamIndexes: number[]
}
declare type ExternalSubtitlesFileRecord = {
  type: 'ExternalSubtitlesFile'
  // parentId: SubtitlesTrackId // should it be MediaFileId? or even needed?
  id: FileId
  parentId: MediaFileId // should it be SubtitlesTrackId? or even needed?
  name: string
}
declare type TemporaryVttFileRecord =
  | {
      type: 'TemporaryVttFile'
      id: FileId // can just be subtitles track/original file id?
      parentId: FileId
      parentType: 'ExternalSubtitlesFile'
    }
  | {
      type: 'TemporaryVttFile'
      id: FileId // can just be subtitles track/original file id?
      parentId: MediaFileId
      streamIndex: number
      parentType: 'MediaFile'
    }
declare type WaveformPngRecord = {
  type: 'WaveformPng'
  id: FileId
  // parentId: MediaFileId
}
declare type ConstantBitrateMp3Record = {
  type: 'ConstantBitrateMp3'
  id: FileId
  // parentId: MediaFileId
}
declare type VideoStillImageRecord = {
  type: 'VideoStillImage'
  id: FileId // can just be cliipid?
  parentId: ClipId
}
