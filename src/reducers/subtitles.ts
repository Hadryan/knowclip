import { Reducer } from 'redux'
import * as A from '../types/ActionType'

const initialState: SubtitlesState = {}

const subtitles: Reducer<SubtitlesState> = (
  state: SubtitlesState = initialState,
  action: Action
) => {
  switch (action.type) {
    case A.MOUNT_SUBTITLES_TRACK:
      return { ...state, [action.track.id]: action.track }

    case A.OPEN_FILE_REQUEST:
      return action.file.type === 'MediaFile' ? initialState : state

    case A.HIDE_SUBTITLES:
      return {
        ...state,
        [action.id]: {
          ...state[action.id],
          mode: 'disabled',
        } as SubtitlesTrack,
      }

    case A.SHOW_SUBTITLES:
      return {
        ...state,
        [action.id]: {
          ...state[action.id],
          mode: 'showing',
        } as SubtitlesTrack,
      }

    case A.DELETE_SUBTITLES_TRACK: {
      const { [action.id]: _, ...newState } = state
      return newState
    }

    default:
      return state
  }
}

export default subtitles
