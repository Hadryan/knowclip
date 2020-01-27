declare type PendingClip = {
  start: WaveformX
  end: WaveformX
}

declare type PendingStretch = {
  originKey: 'start' | 'end'
  id: ClipId
  end: WaveformX
}

declare type UserState = {
  pendingClip: PendingClip | null
  pendingStretch: PendingStretch | null
  highlightedClipId: ClipId | null
  defaultTags: Array<string>
  defaultIncludeStill: boolean
  tagsToClipIds: {
    [K: string]: Array<ClipId>
  }
  currentProjectId: ProjectId | null
  currentMediaFileId: MediaFileId | null
  workIsUnsaved: boolean
  loopMedia: boolean

  progress: ProgressInfo | null
}

declare type ProgressInfo = {
  message: string
  percentage: number
}
