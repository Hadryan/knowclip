import React, { Component } from 'react';
import { connect } from 'react-redux'
import logo from './logo.svg';
import './App.css';
import ShowAll from './ShowAll'
import Waveform from './Waveform'
import getWaveform from './getWaveform'
import { TextField, Button, Checkbox, FormControlLabel } from '@material-ui/core'
import * as s from './selectors'
import * as a from './actions'

const localFlashcardKey = (file) => `${file.type}_____${file.name}`
const setLocalFlashcard = (flashcard) => {
  const { localStorage } = window
  if (localStorage) {
    const serializedFlashcardData = JSON.stringify({ en: flashcard.en, de: flashcard.de })
    localStorage.setItem(localFlashcardKey(flashcard.file), serializedFlashcardData)
  }
}

const getLocalFlashcard = (file) => {
  const { localStorage } = window
  if (localStorage) {
    const local = localStorage.getItem(localFlashcardKey(file))
    return local ? { ...JSON.parse(local), file } : null
  }
}

const getFlashcards = (files) => {
  const map = {};
  files.forEach(file => {
    const local = getLocalFlashcard(file)
    map[file.name] = local || { de: '', en: '', file }
  })
  return map
}


class App extends Component {
  state = {
    files: [],
    modalIsOpen: false,
  }

  setFiles = (e) => {
    const files = [...e.target.files]
    this.setState({
      files,
    }, () => this.germanInput.focus())
    this.props.initializeFlashcards(files)
    this.playAudio(e.target.files[0])
  }

  triggerFileInputClick = () => {
    this.fileInput.click()
  }

  fileInputRef = (el) => this.fileInput = el
  audioRef = (el) => this.audio = el
  germanInputRef = (el) => this.germanInput = el
  svgRef = (el) => this.svg = el

  playAudio = (file) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      this.audio.src = e.target.result
      this.audio.play()
    }
    reader.readAsDataURL(file)

    getWaveform(file)
      .then((svgPath) => {
        this.props.setWaveformPath(svgPath)
      })
  }

  goToFile = (index) => {
    this.props.setCurrentFlashcard(index)
    this.playAudio(this.state.files[index])
  }
  prevFile = () => {
    const lower = this.props.currentFileIndex - 1
    this.goToFile(lower >= 0 ? lower : 0)
  }
  nextFile = () => {
    const higher = this.props.currentFileIndex + 1
    const lastIndex = this.props.filenames.length - 1
    this.goToFile(higher <= lastIndex ? higher : lastIndex)
  }
  handleFlashcardSubmit = (e) => {
    e.preventDefault()
    this.nextFile()
    this.germanInput.focus()
  }

  setFlashcardText = (key, text) => {
    const newFlashcard = {
      ...this.props.currentFlashcard,
      [key]: text,
    }
    this.props.setFlashcardField(this.props.currentFlashcardId, key, text)
    setLocalFlashcard(newFlashcard)
  }

  setGerman = (e) => this.setFlashcardText('de', e.target.value)
  setEnglish = (e) => this.setFlashcardText('en', e.target.value)

  getCurrentFile = () => this.props.getCurrentFile(this.state.files)

  isModalOpen = () => this.state.modalIsOpen

  openModal = () => this.setState({ modalIsOpen: true })
  closeModal = () => this.setState({ modalIsOpen: false })

  handleAudioEnded = (e) => {
    this.nextFile()
  }
  toggleLoop = () => this.props.toggleLoop()

  render() {
    const {
      areFilesLoaded, waveformPath, loop,
      isPrevButtonEnabled, isNextButtonEnabled,
      currentFlashcard, currentFileIndex, flashcards
    } = this.props
    const currentFile = this.getCurrentFile()

    const form = areFilesLoaded
      ? <form className="form" onSubmit={this.handleFlashcardSubmit}>
      <Waveform path={waveformPath} />
        <audio onEnded={this.handleAudioEnded} loop={loop} ref={this.audioRef} controls className="audioPlayer" autoplay></audio>
        <FormControlLabel
          label="Loop"
          control={
            <Checkbox checked={loop} value={loop} onChange={this.toggleLoop} />
          }
        />
        <p className="audioFilenameMenu">
          <Button onClick={this.prevFile} disabled={isPrevButtonEnabled}>Previous</Button>
          <h2 className="audioFileName">
            {currentFile.name}
          </h2>
          <Button onClick={this.nextFile} disabled={isNextButtonEnabled}>Next</Button>
        </p>
        <div className="formBody">
          <p lang="de">
            <TextField inputRef={this.germanInputRef} onChange={this.setGerman} value={currentFlashcard.de} fullWidth multiline label="German" /></p>
          <p lang="en">
            <TextField onChange={this.setEnglish} value={currentFlashcard.en} fullWidth multiline label="English" />
          </p>
          <Button type="submit" fullWidth onClick={this.submitFlashcardForm} disabled={isNextButtonEnabled}>
            Continue
          </Button>
          <Button fullWidth onClick={this.openModal}>Review &amp; export</Button>
        </div>
      </form>
      : <p>
        Select audio files from your <a href="https://apps.ankiweb.net/docs/manual.html#files">Anki collection.media folder</a> to start making flashcards.
      </p>

    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">Audio Flashcard Assistant</h1>
        </header>
        <p>
          <Button label="files" onClick={this.triggerFileInputClick}>
            <input className="fileInput" multiple ref={this.fileInputRef} type="file" onChange={this.setFiles} />
          </Button>
        </p>
        {form}
        <ShowAll
          open={this.isModalOpen()}
          handleClose={this.closeModal}
          flashcards={flashcards}
          files={this.state.files}
          currentFileIndex={currentFileIndex}
          goToFile={this.goToFile}
        />
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  filenames: state.filenames,
  flashcards: s.getFlashcards(state),
  getCurrentFile: s.makeGetCurrentFile(state),
  currentFileIndex: s.getCurrentFileIndex(state),
  currentFlashcard: s.getCurrentFlashcard(state),
  currentFlashcardId: s.getCurrentFlashcardId(state),
  areFilesLoaded: s.areFilesLoaded(state),
  isNextButtonEnabled: s.isNextButtonEnabled(state),
  isPrevButtonEnabled: s.isPrevButtonEnabled(state),
  loop: s.isLoopOn(state),
  waveformPath: s.getWaveformPath(state),
})

const mapDispatchToProps = {
  initializeFlashcards: a.initializeFlashcards,
  setCurrentFlashcard: a.setCurrentFlashcard,
  setFlashcardField: a.setFlashcardField,
  toggleLoop: a.toggleLoop,
  setWaveformPath: a.setWaveformPath,
}

export default connect(mapStateToProps, mapDispatchToProps)(App)
