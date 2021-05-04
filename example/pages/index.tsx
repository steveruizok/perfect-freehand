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
import PressureIndicator from 'components/pressure-indicator'
const Controls = dynamic(() => import('../components/controls'), { ssr: false })
const Toolbar = dynamic(() => import('../components/toolbar'), { ssr: false })

function handleTouchStart(e: React.TouchEvent) {
  e.preventDefault()
}

function handleTouchMove(e: React.TouchEvent) {
  e.preventDefault()
}

function handleTouchEnd(e: React.TouchEvent) {
  e.preventDefault()
}

export default function Home() {
  useDarkMode()
  useLocalData()
  const events = useEvents()
  const ref = useSvgResizer()
  const marks = useSelector(state => state.data.marks)
  const currentMark = useSelector(state => state.data.currentMark)
  const showTrace = useSelector(state => state.data.settings.showTrace)
  const darkMode = useSelector(state => state.data.settings.darkMode)
  const lastPressure = useSelector(state => state.data.lastPressure)

  return (
    <>
      <Head>
        <title>Perfect Freehand Example</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main>
        <Toolbar />
        <Wrapper {...events}>
          <SVGCanvas
            ref={ref}
            viewBox={'0 0 800 600'}
            id="drawable-svg"
            pointerEvents="none"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onTouchMove={handleTouchMove}
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
`

const SVGCanvas = styled.svg`
  touch-action: none;
  width: 100%;
  height: 100%;
`
