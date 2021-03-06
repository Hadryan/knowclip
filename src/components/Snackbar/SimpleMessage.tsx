import React, { useState, useCallback } from 'react'
import { Snackbar, IconButton } from '@material-ui/core'
import { Close } from '@material-ui/icons'
import DarkTheme from '../DarkTheme'
import { useDispatch } from 'react-redux'
import cn from 'classnames'
import { closeSnackbar } from '../../actions'
import { snackbar$ } from '.'

const SimpleMessageSnackbar = ({
  message,
  closeButtonId,
}: {
  message: string
  closeButtonId: string
}) => {
  const [open, setOpen] = useState(true)

  const handleClose = useCallback(e => setOpen(false), [setOpen])

  const dispatch = useDispatch()
  const handleExited = useCallback(e => dispatch(closeSnackbar()), [dispatch])

  return (
    // TODO: distinguish error and success messages
    <Snackbar
      className={cn(snackbar$.container)}
      open={open}
      message={message}
      autoHideDuration={15000}
      onClose={handleClose}
      onExited={handleExited}
      action={
        <DarkTheme>
          <IconButton onClick={handleClose} id={closeButtonId}>
            <Close />
          </IconButton>
        </DarkTheme>
      }
    />
  )
}

export default SimpleMessageSnackbar
