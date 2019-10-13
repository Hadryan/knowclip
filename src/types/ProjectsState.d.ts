declare type ProjectFilePath = string

declare type ProjectMetadata = {
  id: ProjectId
  filePath: ProjectFilePath
  name: string
  noteType: NoteType
  mediaFiles: Array<MediaFileId>
  error: string | null
}

declare type ProjectsState = {
  byId: Record<ProjectId, ProjectMetadata>
  allIds: Array<ProjectId>
}

declare type ProjectMetadata_Pre_4 = {
  id: ProjectId
  filePath: ProjectFilePath
  name: string
  noteType: NoteType
  mediaFiles: Array<MediaFileId>
  error: string | null
}
