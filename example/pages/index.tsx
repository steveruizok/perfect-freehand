import Head from 'next/head'
import dynamic from 'next/dynamic'
import styled from 'styled-components'
import * as React from 'react'
import { useSelector } from '../state'
import useEvents from '../hooks/useEvents'
import useLocalData from '../hooks/useLocalData'
import useDarkMode from '../hooks/useDarkMode'
import useSvgResizer from 'hooks/useSvgResizer'
import PenMode from 'components/pen-mode'
import IPadWarning from 'components/ipad-warning'
import PressureIndicator from 'components/pressure-indicator'
const Controls = dynamic(() => import('../components/controls'), { ssr: false })
const Toolbar = dynamic(() => import('../components/toolbar'), { ssr: false })

export default function Home() {
  const rSoak = React.useRef<HTMLDivElement>(null)
  useDarkMode()
  useLocalData()
  const events = useEvents()
  const ref = useSvgResizer()
  const marks = useSelector(state => state.data.marks)
  const currentMark = useSelector(state => state.data.currentMark)
  const showTrace = useSelector(state => state.data.settings.showTrace)
  const darkMode = useSelector(state => state.data.settings.darkMode)
  const penMode = useSelector(state => state.data.settings.penMode)

  React.useEffect(() => {
    function preventDefault(e: TouchEvent) {
      e.preventDefault()
    }

    if (rSoak.current && penMode) {
      rSoak.current.addEventListener('gesturestart', preventDefault, false)
      rSoak.current.addEventListener('gestureend', preventDefault, false)
      rSoak.current.addEventListener('gesturechange', preventDefault, false)
      rSoak.current.addEventListener('touchmove', preventDefault, false)
      rSoak.current.addEventListener('touchstart', preventDefault, false)
      rSoak.current.addEventListener('touchend', preventDefault, false)
      rSoak.current.addEventListener('touchcancel', preventDefault, false)
    }

    return () => {
      if (rSoak.current) {
        rSoak.current.removeEventListener('gesturestart', preventDefault, false)
        rSoak.current.removeEventListener('gestureend', preventDefault, false)
        rSoak.current.removeEventListener(
          'gesturechange',
          preventDefault,
          false
        )
        rSoak.current.removeEventListener('touchmove', preventDefault, false)
        rSoak.current.removeEventListener('touchstart', preventDefault, false)
        rSoak.current.removeEventListener('touchend', preventDefault, false)
        rSoak.current.removeEventListener('touchcancel', preventDefault, false)
      }
    }
  }, [penMode])

  return (
    <>
      <Head>
        <title>Perfect Freehand Example</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main>
        <Toolbar />
        <Wrapper ref={rSoak} {...events}>
          <SVGCanvas
            ref={ref}
            viewBox={'0 0 800 600'}
            id="drawable-svg"
            pointerEvents="none"
          >
            <g strokeWidth={showTrace ? 2 : 0}>
              {marks.map((mark, i) => (
                <path
                  key={i}
                  d={mark.path}
                  stroke={darkMode ? '#fff' : '#000'}
                  fill={showTrace ? 'transparent' : darkMode ? '#fff' : '#000'}
                />
              ))}
              {currentMark && (
                <path
                  d={currentMark.path}
                  stroke={darkMode ? '#fff' : '#000'}
                  fill={showTrace ? 'transparent' : darkMode ? '#fff' : '#000'}
                />
              )}
              <PressureIndicator />
            </g>
          </SVGCanvas>
          <Controls />
        </Wrapper>
        <PenMode />
        <IPadWarning />
      </main>
    </>
  )
}

const Wrapper = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  touch-action: none;
  user-select: none;
`

const SVGCanvas = styled.svg`
  touch-action: none;
  width: 100%;
  height: 100%;
`
