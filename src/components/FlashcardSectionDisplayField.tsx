import React, {
  useCallback,
  ReactNodeArray,
  useEffect,
  ReactNode,
  useMemo,
} from 'react'
import cn from 'classnames'
import css from './FlashcardSectionDisplay.module.css'
import FieldMenu, {
  useSubtitlesBySource,
} from './FlashcardSectionFieldPopoverMenu'
import { Tooltip } from '@material-ui/core'
import { useSelector } from 'react-redux'
import { getSelectionWithin, ClozeTextInputActions } from '../utils/useClozeUi'

const FlashcardDisplayField = ({
  children,
  fieldName,
  subtitles,
  linkedTracks,
  mediaFileId,
  onDoubleClick,
  className,
  title,
  clozeIndex = -1,
  clozeDeletions,
  previewClozeIndex = -1,
  fieldValueRef,
  clozeTextInputActions,
}: {
  children: string | null
  fieldName: FlashcardFieldName
  subtitles: MediaSubtitlesRelation[]
  linkedTracks: SubtitlesFlashcardFieldsLinks
  mediaFileId: MediaFileId
  onDoubleClick?: ((fieldName: FlashcardFieldName) => void)
  className?: string
  title?: string
  clozeIndex?: number
  clozeDeletions?: ClozeDeletion[]
  previewClozeIndex?: number
  fieldValueRef?: React.RefObject<HTMLSpanElement>
  clozeTextInputActions?: ClozeTextInputActions
}) => {
  const {
    embeddedSubtitlesTracks,
    externalSubtitlesTracks,
  } = useSubtitlesBySource(subtitles)
  const linkedSubtitlesTrack = linkedTracks[fieldName] || null
  const handleDoubleClick = useCallback(
    () => {
      if (onDoubleClick) onDoubleClick(fieldName)
    },
    [fieldName, onDoubleClick]
  )
  const viewMode = useSelector((state: AppState) => state.settings.viewMode)

  const subtitlesMenu = Boolean(subtitles.length) && (
    <FieldMenu
      className={css.previewFieldMenuButton}
      embeddedSubtitlesTracks={embeddedSubtitlesTracks}
      externalSubtitlesTracks={externalSubtitlesTracks}
      linkedSubtitlesTrack={linkedSubtitlesTrack}
      mediaFileId={mediaFileId}
      fieldName={fieldName as TransliterationFlashcardFieldName}
    />
  )

  const currentClozeId = ClozeIds[clozeIndex]
  const selectionHue =
    ClozeHues[
      currentClozeId || ClozeIds[clozeDeletions ? clozeDeletions.length : -1]
    ]

  return (
    <div
      className={cn(css.previewField, className, {
        [css.previewFieldWithPopover]: Boolean(subtitles.length),
      })}
      onDoubleClick={handleDoubleClick}
      style={{
        ['--cloze-selection-hue' as any]: selectionHue,
      }}
    >
      {clozeDeletions && children && fieldValueRef ? (
        <div
          className={cn(css.clozeField, {
            [css.clozeFieldEditing]: clozeIndex !== -1,
          })}
        >
          {clozeTextInputActions && (
            <ClozeField
              fieldName={fieldName}
              value={children}
              title={title}
              clozeIndex={clozeIndex}
              deletions={clozeDeletions || []}
              subtitlesMenu={subtitlesMenu}
              previewClozeIndex={previewClozeIndex}
              fieldValueRef={fieldValueRef}
              clozeTextInputActions={clozeTextInputActions}
            />
          )}
        </div>
      ) : (
        <>
          {subtitlesMenu}
          <FlashcardDisplayFieldValue
            fieldName={fieldName}
            value={children}
            title={title}
            fieldValueRef={fieldValueRef}
          />
        </>
      )}
    </div>
  )
}

const FlashcardDisplayFieldValue = ({
  fieldName,
  value,
  title,
  clozeIndex,
  fieldValueRef,
}: {
  fieldName: FlashcardFieldName
  value: string | null
  title: string | undefined
  clozeIndex?: number
  fieldValueRef?: React.RefObject<HTMLSpanElement>
}) => {
  if (!value)
    return title ? (
      <Tooltip title={title}>
        <span className={css.emptyFieldPlaceholder}>{fieldName}</span>
      </Tooltip>
    ) : (
      <span className={css.emptyFieldPlaceholder}>{fieldName}</span>
    )

  const withoutNewlines: ReactNodeArray = []
  const lines = value.split(/[\n\r]/)
  lines.forEach((line, i) => {
    if (i !== 0)
      withoutNewlines.push(
        <span className={css.newlinePlaceholder} key={String(i)}>
          <span className={css.newline}>{'\n'}</span>
        </span>
      )
    withoutNewlines.push(line)
  })

  return (
    <span ref={fieldValueRef} className={css.fieldValue}>
      {withoutNewlines}
    </span>
  )
}

export type ClozeId =
  | 'c1'
  | 'c2'
  | 'c3'
  | 'c4'
  | 'c5'
  | 'c6'
  | 'c7'
  | 'c8'
  | 'c9'
  | 'c10'
export const ClozeIds = [
  'c1',
  'c2',
  'c3',
  'c4',
  'c5',
  'c6',
  'c7',
  'c8',
  'c9',
  'c10',
] as const

export const ClozeHues = {
  c1: 240,
  c2: 130,
  c3: 60,
  c4: 180,
  c5: 300,
  c6: 41,
  c7: 78,
  c8: 0,
  c9: 202,
  c10: 271,
}

const charSpan = (
  char: string,
  index: number,
  className: string,
  clozeIndex: number,
  newlineChar: string
) => {
  const isNewline = char === '\n' || char === '\r'
  return (
    <span
      className={cn(className, { [css.clozeNewlinePlaceholder]: isNewline })}
      key={String(index)}
      style={{
        ['--cloze-background-hue' as any]: ClozeHues[ClozeIds[clozeIndex]],
      }}
    >
      {isNewline ? newlineChar : char}
    </span>
  )
}

const clearNewlines = (
  value: string,
  viewMode: ViewMode,
  className?: string
) => {
  const char = viewMode === 'VERTICAL' ? '\n' : '⏎'
  const withoutNewlines: ReactNodeArray = []
  const lines = value.split(/[\n\r]/)
  lines.forEach((line, i) => {
    if (i !== 0)
      withoutNewlines.push(
        <span
          className={cn(css.clozeNewlinePlaceholder, className)}
          key={String(i)}
        >
          {char}
        </span>
      )
    withoutNewlines.push(<span className={className}>{line}</span>)
  })
  return withoutNewlines
}

let shiftKeyHeld = false
const ClozeField = ({
  fieldName,
  value,
  title,
  clozeIndex: currentClozeIndex,
  previewClozeIndex,
  deletions,
  subtitlesMenu,
  fieldValueRef: ref,
  clozeTextInputActions: {
    onSelect,
    onBackspace,
    onPressDelete,
    onEnter,
    onEscape,
  },
}: // confirmSelection,
// textAreaRef,
{
  fieldName: FlashcardFieldName
  value: string
  title: string | undefined
  clozeIndex: number
  previewClozeIndex: number
  deletions: ClozeDeletion[]
  subtitlesMenu: ReactNode
  fieldValueRef: React.RefObject<HTMLSpanElement>
  clozeTextInputActions: ClozeTextInputActions
}) => {
  useEffect(
    () => {
      if (ref.current) {
        const selection = window.getSelection()
        if (selection) selection.empty()
        console.log('focusing!', { selection })
        ref.current.blur()
        ref.current.focus()
      }
    },
    [currentClozeIndex, ref]
  )
  const clozeId = ClozeIds[currentClozeIndex]
  const viewMode = useSelector((state: AppState) => state.settings.viewMode)

  const rangesWithClozeIndexes = deletions
    .flatMap(({ ranges }, clozeIndex) => {
      return ranges.map(range => ({ range, clozeIndex }))
    })
    .sort((a, b) => a.range.start - b.range.start)
  const segments: ReactNode[] = useMemo(
    () => {
      const newlineChar = viewMode === 'HORIZONTAL' ? '⏎' : '\n'
      const segments = rangesWithClozeIndexes.length
        ? []
        : clearNewlines(value, viewMode)
      rangesWithClozeIndexes.forEach(
        ({ range: { start, end }, clozeIndex }, i) => {
          if (i === 0 && start > 0) {
            segments.push(
              ...[...value.slice(0, start)].map((c, i) =>
                charSpan(c, i, css.clozeValueChar, clozeIndex, newlineChar)
              )
            )
          }
          segments.push(
            ...[...value.slice(start, end)].map((c, i) =>
              charSpan(
                c,
                start + i,
                cn(css.blank, {
                  [css.previewBlank]:
                    previewClozeIndex !== -1 &&
                    previewClozeIndex === clozeIndex,
                  [css.blankEditing]: clozeIndex === currentClozeIndex,
                }),
                clozeIndex,
                newlineChar
              )
            )
          )

          const nextRange: {
            range: ClozeRange
            clozeIndex: number
          } | null = rangesWithClozeIndexes[i + 1] || null
          const subsequentGapEnd = nextRange
            ? nextRange.range.start
            : value.length

          if (subsequentGapEnd - end > 0) {
            // segments.push(clearNewlines(value.slice(end, subsequentGapEnd), viewMode))
            segments.push(
              ...[...value.slice(end, subsequentGapEnd)].map((c, i) =>
                charSpan(
                  c,
                  end + i,
                  css.clozeValueChar,
                  clozeIndex,
                  newlineChar
                )
              )
            )
          }
        }
      )
      return segments
    },
    [
      currentClozeIndex,
      previewClozeIndex,
      rangesWithClozeIndexes,
      value,
      viewMode,
    ]
  )
  const onCopy = useCallback(e => {
    const selection = window.getSelection()
    if (!selection) return
    var text = selection.toString().replace(/⏎/g, '\n')
    e.clipboardData.setData('text/plain', text)
    e.preventDefault()
  }, [])

  const editing = currentClozeIndex !== -1

  const onKeyDown = useCallback(
    e => {
      if (!isEnabledKey(e.keyCode, e.ctrlKey)) e.preventDefault()
      switch (e.keyCode) {
        // enter
        case 13: {
          e.preventDefault()
          onEnter()
          break
        }
        // delete
        case 46: {
          if (ref.current) {
            const selection = getSelectionWithin(ref.current)
            // if/ (selection.start !== selection.end || select
            onPressDelete(selection)
          }
          break
        }
        // backspace
        case 8: {
          if (ref.current) {
            const selection = getSelectionWithin(ref.current)
            onBackspace(selection)
          }
          break
        }
        // shift
        case 16:
          return (shiftKeyHeld = true)

        // escape
        case 27:
          onEscape()
          return e.stopPropagation()

        default:
      }
    },
    // [confirmSelection]
    [onBackspace, onEnter, onEscape, onPressDelete, ref]
  )
  const preventDefault = useCallback(e => {
    e.preventDefault()
  }, [])
  const handleSelect = useCallback(
    e => {
      if (!shiftKeyHeld) {
        console.log(e.target)
        const selection = getSelectionWithin(e.target)
        if (selection.start === selection.end) return
        onSelect(selection)
      }
    },
    [onSelect]
  )
  const handleKeyUp = useCallback(
    e => {
      // shift key
      if (e.keyCode === 16) {
        shiftKeyHeld = false
        const selection = getSelectionWithin(e.target)
        if (selection.start === selection.end) return
        onSelect(selection)
      }
    },
    [onSelect]
  )

  const clozeHint = (
    <>
      Select the text you wish to blank out.
      <br />
      <br />
      Hit Backspace to trim selection.
      <br />
      <br />
      Hit Enter when finished.
    </>
  )

  const content = (
    <span
      className={cn(css.clozeFieldValue, clozeId, {
        [css.clozePreviewFieldValue]: previewClozeIndex !== -1,
      })}
      contentEditable={editing}
      suppressContentEditableWarning
      onKeyDown={onKeyDown}
      onPaste={preventDefault}
      onCut={preventDefault}
      onDragEnd={preventDefault}
      onDragExit={preventDefault}
      onDragOver={preventDefault}
      onSelect={handleSelect}
      onKeyUp={handleKeyUp}
      onCopy={onCopy}
      ref={ref}
    >
      {segments}
    </span>
  )

  return (
    <>
      {subtitlesMenu}
      {editing ? <Tooltip title={clozeHint}>{content}</Tooltip> : content}
    </>
  )
}

const ENABLED_KEYS = [
  9, // tab
  16, // shift
  37, // left
  39, // right
  27, // escape
]
const ENABLED_CTRL_KEYS = [
  ...ENABLED_KEYS,
  67, // c
  65, // a
]
const isEnabledKey = (keyCode: number, ctrlKey: boolean) =>
  ctrlKey ? ENABLED_CTRL_KEYS.includes(keyCode) : ENABLED_KEYS.includes(keyCode)

export default FlashcardDisplayField