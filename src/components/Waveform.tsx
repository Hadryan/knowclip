import React, { Fragment, memo, useRef, useCallback } from 'react'
import cn from 'classnames'
import { useSelector, useDispatch } from 'react-redux'
import * as r from '../redux'
import css from './Waveform.module.css'
import {
  toWaveformCoordinates,
  getSecondsAtXFromWaveform,
} from '../utils/waveformCoordinates'
import WaveformMousedownEvent from '../utils/WaveformMousedownEvent'

enum $ {
  container = 'waveform-container',
  subtitlesTimelinesContainer = 'subtitles-timelines-container',
  subtitlesTimelines = 'subtitles-timeline',
  waveformClipsContainer = 'waveform-clips-container',
  waveformClip = 'waveform-clip',
}

const { SELECTION_BORDER_WIDTH } = r
const WAVEFORM_HEIGHT = 70

const Cursor = ({ x, height }: { x: number; height: number }) => (
  <line
    stroke="orange"
    x1={x}
    y1="-1"
    x2={x}
    y2={height}
    shapeRendering="crispEdges"
  />
)

const getClipPath = (start: number, end: number) =>
  `M${start} 0 L${end} 0 L${end} ${WAVEFORM_HEIGHT} L${start} ${WAVEFORM_HEIGHT} L${start} 0`

type ClipProps = {
  id: string
  start: number
  end: number
  isHighlighted: boolean
}
const Clip = ({ id, start, end, isHighlighted }: ClipProps) => {
  return (
    <g id={id}>
      <path
        className={cn(
          css.waveformClip,
          { [css.highlightedClip]: isHighlighted },
          $.waveformClip
        )}
        d={getClipPath(start, end)}
      />

      <rect
        className={cn(css.waveformClipBorder, {
          [css.highlightedClipBorder]: isHighlighted,
        })}
        x={start}
        y="0"
        width={SELECTION_BORDER_WIDTH}
        height={WAVEFORM_HEIGHT}
      />
      <rect
        className={cn(css.waveformClipBorder, {
          [css.highlightedClipBorder]: isHighlighted,
        })}
        x={end - SELECTION_BORDER_WIDTH}
        y="0"
        width={SELECTION_BORDER_WIDTH}
        height={WAVEFORM_HEIGHT}
      />
    </g>
  )
  // <path className="waveform-clip-border" d={`M${start} 0 L${leftBorderInnerEdge} 0 L`} />
}

type ChunkProps = { start: number; end: number; stepsPerSecond: number }

const PendingClip = ({ start, end }: ChunkProps) => (
  <path className={css.waveformPendingClip} d={getClipPath(start, end)} />
)

const PendingStretch = ({ start, end }: ChunkProps) => (
  <path className={css.waveformPendingStretch} d={getClipPath(start, end)} />
)

const getViewBoxString = (xMin: number, height: number) =>
  `${xMin} 0 3000 ${height}`
const getSubtitlesViewBoxString = (xMin: number, yMax: number) =>
  `${xMin} 0 3000 ${yMax}`

const Clips = React.memo(
  ({
    clips,
    highlightedClipId,
  }: {
    clips: Clip[]
    highlightedClipId: string | null
  }) => (
    <g className={$.waveformClipsContainer}>
      {clips.map(clip => (
        <Clip
          {...clip}
          key={clip.id}
          isHighlighted={clip.id === highlightedClipId}
        />
      ))}
    </g>
  )
)

const getSubtitlesPath = (
  startX: number,
  endX: number,
  startY: number,
  endY: number
) => {
  return `M${startX} ${startY} L${endX} ${startY} L${endX} ${endY} L${startX} ${endY} L${startX} ${startY}`
}

const SUBTITLES_CHUNK_HEIGHT = 24

const SubtitlesChunk = ({
  chunk,
  trackIndex,
  chunkIndex,
  trackId,
}: {
  chunk: SubtitlesChunk
  trackIndex: number
  chunkIndex: number
  trackId: string
}) => {
  const clipPathId = `${trackId}__${chunkIndex}`
  const width = chunk.end - chunk.start

  const rect = {
    x: chunk.start,
    y: WAVEFORM_HEIGHT + trackIndex * SUBTITLES_CHUNK_HEIGHT,
    width: width,
    height: SUBTITLES_CHUNK_HEIGHT,
  }
  return (
    <g
      className={css.subtitlesChunk}
      data-chunk-index={chunkIndex}
      data-track-id={trackId}
    >
      <clipPath id={clipPathId}>
        <rect {...rect} width={width - 10} />
      </clipPath>
      <rect
        className={css.subtitlesChunkRectangle}
        data-track-id={trackId}
        data-chunk-index={chunkIndex}
        {...rect}
        rx={SUBTITLES_CHUNK_HEIGHT / 2}
      />
      <text
        clipPath={`url(#${clipPathId})`}
        data-chunk-index={chunkIndex}
        data-track-id={trackId}
        className={css.subtitlesText}
        x={chunk.start + 10}
        y={(trackIndex + 1) * SUBTITLES_CHUNK_HEIGHT - 6 + WAVEFORM_HEIGHT}
      >
        {chunk.text}
        {/* <textPath
          width={width}
          height={SUBTITLES_CHUNK_HEIGHT}
          x={chunk.start + 4}
          y={(trackIndex + 1) * SUBTITLES_CHUNK_HEIGHT - 6}
        >
          {chunk.text}
        </textPath> */}
      </text>
    </g>
  )
}
const SubtitlesTimelines = memo(
  ({
    subtitles,
    viewBox,
    goToSubtitlesChunk,
  }: {
    subtitles: SubtitlesTrack[]
    viewBox: WaveformViewBox
    goToSubtitlesChunk: (trackId: string, chunkIndex: number) => void
  }) => {
    const handleClick = useCallback(
      e => {
        e.stopPropagation()
        goToSubtitlesChunk(
          e.target.dataset.trackId,
          e.target.dataset.chunkIndex
        )
      },
      [goToSubtitlesChunk]
    )
    return (
      <g
        className={cn(css.subtitlesSvg, $.subtitlesTimelinesContainer)}
        width="100%"
        onClick={handleClick}
      >
        {subtitles.map(({ chunks, id }, trackIndex) => (
          <g className={$.subtitlesTimelines} key={id}>
            {chunks.map((chunk, index) => (
              <SubtitlesChunk
                key={`${chunk.start}_${chunk.text}`}
                chunk={chunk}
                trackIndex={trackIndex}
                trackId={id}
                chunkIndex={index}
              />
            ))}
          </g>
        ))}
      </g>
    )
  }
)

const Waveform = ({ show }: { show: boolean }) => {
  const {
    waveform,
    path,
    clips,
    pendingClip,
    pendingStretch,
    highlightedClipId,
    subtitles,
  } = useSelector((state: AppState) => ({
    waveform: r.getWaveform(state),
    path: r.getWaveformPath(state),
    clips: r.getCurrentFileClips(state),
    pendingClip: r.getPendingClip(state),
    pendingStretch: r.getPendingStretch(state),
    highlightedClipId: r.getHighlightedClipId(state),
    subtitles: r.getSubtitlesTracks(state),
  }))

  const dispatch = useDispatch()
  const goToSubtitlesChunk = useCallback(
    (trackId: string, chunkIndex: number) => {
      dispatch(r.goToSubtitlesChunk(trackId, chunkIndex))
    },
    [dispatch]
  )

  const { viewBox, cursor, stepsPerSecond } = waveform
  const height = WAVEFORM_HEIGHT + subtitles.length * SUBTITLES_CHUNK_HEIGHT
  const viewBoxString = getViewBoxString(viewBox.xMin, height)
  const svgRef = useRef(null)
  const onMouseDown = useCallback(
    e => {
      const coords = toWaveformCoordinates(
        e,
        e.currentTarget,
        waveform.viewBox.xMin
      )
      const waveformMousedown = new WaveformMousedownEvent(
        e.currentTarget,
        getSecondsAtXFromWaveform(waveform, coords.x)
      )
      document.dispatchEvent(waveformMousedown)
    },
    [waveform]
  )
  return show ? (
    <svg
      ref={svgRef}
      id="waveform-svg"
      viewBox={viewBoxString}
      preserveAspectRatio="xMinYMin slice"
      className={cn(css.waveformSvg, $.container)}
      width="100%"
      onMouseDown={onMouseDown}
      height={height}
    >
      <Clips {...{ clips, highlightedClipId, stepsPerSecond }} />
      {pendingClip && (
        <PendingClip {...pendingClip} stepsPerSecond={stepsPerSecond} />
      )}
      {pendingStretch && (
        <PendingStretch {...pendingStretch} stepsPerSecond={stepsPerSecond} />
      )}
      {path && (
        <image xlinkHref={`file://${path}`} style={{ pointerEvents: 'none' }} />
      )}
      <Cursor {...cursor} height={height} />

      {Boolean(subtitles.length) && (
        <SubtitlesTimelines
          subtitles={subtitles}
          viewBox={viewBox}
          goToSubtitlesChunk={goToSubtitlesChunk}
        />
      )}
    </svg>
  ) : (
    <div className={css.waveformPlaceholder} />
  )
}

export default Waveform

export { $ as waveform$ }
