import React, { Fragment, useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { IconButton } from '@material-ui/core'
import { Delete } from '@material-ui/icons'
import cn from 'classnames'
import MediaFilesMenu from '../components/MediaFilesMenu'
import ProjectMenu from '../components/ProjectMenu'
import headerCss from '../components/MainHeader.module.css'
import * as actions from '../actions'
import SubtitlesMenu from '../components/SubtitlesMenu'

enum $ {
  container = 'main-screen-header',
}

const MainHeader = ({
  currentProjectId,
  currentMediaFile,
}: {
  currentProjectId: string
  currentMediaFile: MediaFile | null
}) => {
  const dispatch = useDispatch()
  const deleteAllCurrentFileClipsRequest = useCallback(
    () => dispatch(actions.deleteAllCurrentFileClipsRequest()),
    [dispatch]
  )
  return (
    <header className={cn(headerCss.container, $.container)}>
      <ProjectMenu className={headerCss.block} />
      <section className={headerCss.block}>
        <MediaFilesMenu
          className={headerCss.leftMenu}
          currentProjectId={currentProjectId}
        />
      </section>
      <ul className={headerCss.rightMenu}>
        {currentMediaFile && (
          <Fragment>
            <li className={headerCss.menuItem}>
              <SubtitlesMenu />
            </li>
            {/* <li className={headerCss.menuItem}>
              <Tooltip title="Detect silences">
                <IconButton onClick={detectSilenceRequest}>
                  <HearingIcon />
                </IconButton>
              </Tooltip>
            </li> */}
            <li className={headerCss.menuItem}>
              <IconButton onClick={deleteAllCurrentFileClipsRequest}>
                <Delete />
              </IconButton>
            </li>
          </Fragment>
        )}
      </ul>
    </header>
  )
}

export default MainHeader

export { $ as mainHeader$ }
