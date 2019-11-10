import React from 'react'
import { connect } from 'react-redux'
import { Dialog, DialogContent } from '@material-ui/core'
import FileSelectionForm from '../FileSelectionForm'
import * as r from '../../redux'
import { getExtensions } from '../../utils/files'

const FileSelectionDialog = ({
  open,
  closeDialog,
  onSubmit,
  message,
  fileRecord,
}) => (
  <Dialog open={open}>
    <DialogContent>
      <FileSelectionForm
        message={message}
        onSubmit={onSubmit}
        extensions={getExtensions(fileRecord)}
        cancel={closeDialog}
      />
    </DialogContent>
  </Dialog>
)

const mapDispatchToProps = (dispatch, { fileRecord, closeDialog }) => ({
  closeDialog,
  onSubmit: path => {
    dispatch(r.locateFileSuccess(fileRecord, path))
    closeDialog()
  },
  loadFileFailure: () =>
    dispatch(r.loadFileFailure(fileRecord, null, 'Could not locate file.')),
})

export default connect(
  null,
  mapDispatchToProps
)(FileSelectionDialog)