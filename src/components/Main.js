import React, { Component, Fragment } from 'react'
import { connect } from 'react-redux'
import {
  TextField,
  Button,
  IconButton,
  Checkbox,
  FormControlLabel,
  CircularProgress,
  Tooltip,
} from '@material-ui/core'
import {
  Hearing as HearingIcon,
  Delete as DeleteIcon,
} from '@material-ui/icons'
import { Link } from 'react-router-dom'
import formatTime from '../utils/formatTime'
import ShowAll from '../components/ShowAll'
import Waveform from '../components/Waveform'
import FlashcardForm from '../components/FlashcardForm'
import AudioFilesNavMenu from '../components/AudioFilesNavMenu'
import DefineSchemaForm from '../components/DefineSchemaForm'
import * as r from '../redux'
import electron from 'electron'

const { remote } = electron
const { dialog } = remote

class App extends Component {
  state = {
    filePaths: [],
    modalIsOpen: false,
  }

  componentDidMount() {
    this.props.initializeApp()
  }

  chooseAudioFiles = () => {
    dialog.showOpenDialog(
      { properties: ['openFile', 'multiSelections'] },
      filePaths => {
        if (!filePaths) return
        this.setState({ filePaths }, async () => {
          // now, this line
          // should really happen after a clip is selected.
          // this.germanInput.focus()

          this.props.chooseAudioFiles(filePaths, this.props.defaultNoteTypeId)
        })
      }
    )
  }

  removeAudioFiles = () => this.props.removeAudioFiles()

  audioRef = el => (this.audio = el)
  svgRef = el => (this.svg = el)

  goToFile = index => this.props.setCurrentFile(index)
  prevFile = () => {
    const lower = this.props.currentFileIndex - 1
    this.goToFile(lower >= 0 ? lower : 0)
  }
  nextFile = () => {
    const higher = this.props.currentFileIndex + 1
    const lastIndex = this.props.filePaths.length - 1
    this.goToFile(higher <= lastIndex ? higher : lastIndex)
  }

  deleteCard = () => {
    const { deleteCard, highlightedWaveformSelectionId } = this.props
    if (highlightedWaveformSelectionId) {
      deleteCard(highlightedWaveformSelectionId)
    }
  }

  openModal = () => this.setState({ modalIsOpen: true })
  closeModal = () => this.setState({ modalIsOpen: false })

  handleAudioEnded = e => {
    this.nextFile()
  }
  toggleLoop = () => this.props.toggleLoop()

  render() {
    const {
      loop,
      isPrevButtonEnabled,
      isNextButtonEnabled,
      currentFlashcard,
      currentFileIndex,
      flashcards,
      currentFileName,
      makeClips,
      exportFlashcards,
      highlightSelection,
      audioIsLoading,
      mediaFolderLocation,
      detectSilenceRequest,
      deleteAllCurrentFileClipsRequest,
      currentNoteType,
    } = this.props

    const form = Boolean(currentFlashcard) ? (
      <FlashcardForm />
    ) : (
      <p>Click + drag to make audio clips and start making flashcards.</p>
    )

    return (
      <div className="App">
        <header className="App-header">
          <h1 className="App-title">Audio Flashcard Assistant v0.0.0</h1>
          <p>
            audio will be saved in:{' '}
            <Link to="/media-folder-location">{mediaFolderLocation}</Link>
          </p>
          <p>
            using note type:{' '}
            <Link to={`/define-schema/${currentNoteType.id}`}>
              {currentNoteType.name}
            </Link>
          </p>
        </header>
        <AudioFilesNavMenu
          onClickPrevious={this.prevFile}
          onClickNext={this.nextFile}
          currentFilename={currentFileName}
          isPrevButtonEnabled={isPrevButtonEnabled}
          isNextButtonEnabled={isNextButtonEnabled}
          chooseAudioFiles={this.chooseAudioFiles}
          removeAudioFiles={this.removeAudioFiles}
        />
        <Waveform show={!audioIsLoading} svgRef={this.svgRef} />
        {audioIsLoading && (
          <div className="waveform-placeholder">
            <CircularProgress />
          </div>
        )}
        <p>
          <audio
            onEnded={this.handleAudioEnded}
            loop={loop}
            ref={this.audioRef}
            controls
            id="audioPlayer"
            className="audioPlayer"
            controlsList="nodownload"
            autoPlay
          />
          <Tooltip title="Detect silences">
            <IconButton onClick={detectSilenceRequest}>
              <HearingIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete all clips for this file">
            <IconButton onClick={deleteAllCurrentFileClipsRequest}>
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </p>
        {form}
        <Button fullWidth onClick={this.openModal}>
          Review &amp; export
        </Button>
        <ShowAll
          open={this.state.modalIsOpen}
          handleClose={this.closeModal}
          flashcards={flashcards}
          files={null /* this.state.files */}
          currentFileIndex={currentFileIndex}
          highlightSelection={highlightSelection}
          makeClips={makeClips}
          exportFlashcards={exportFlashcards}
          currentNoteType={currentNoteType}
        />
      </div>
    )
  }
}

const mapStateToProps = state => ({
  filePaths: r.getFilePaths(state),
  flashcards: r.getFlashcardsByTime(state),
  currentFileIndex: r.getCurrentFileIndex(state),
  currentFileName: r.getCurrentFileName(state),
  currentFlashcard: r.getCurrentFlashcard(state),
  currentFlashcardId: r.getCurrentFlashcardId(state),
  isNextButtonEnabled: r.isNextButtonEnabled(state),
  isPrevButtonEnabled: r.isPrevButtonEnabled(state),
  loop: r.isLoopOn(state),
  highlightedWaveformSelectionId: r.getHighlightedWaveformSelectionId(state),
  clipsTimes: r.getClipsTimes(state),
  audioIsLoading: r.isAudioLoading(state),
  mediaFolderLocation: r.getMediaFolderLocation(state),
  currentNoteType: r.getCurrentNoteType(state),
  defaultNoteTypeId: r.getDefaultNoteTypeId(state),
})

const mapDispatchToProps = {
  chooseAudioFiles: r.chooseAudioFiles,
  removeAudioFiles: r.removeAudioFiles,
  setCurrentFile: r.setCurrentFile,
  setFlashcardField: r.setFlashcardField,
  toggleLoop: r.toggleLoop,
  deleteCard: r.deleteCard,
  makeClips: r.makeClips,
  exportFlashcards: r.exportFlashcards,
  highlightSelection: r.highlightSelection,
  initializeApp: r.initializeApp,
  detectSilenceRequest: r.detectSilenceRequest,
  deleteAllCurrentFileClipsRequest: r.deleteAllCurrentFileClipsRequest,
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(App)
