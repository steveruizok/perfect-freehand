import Head from 'next/head'
import * as React from 'react'
import { useSelector } from '../state'
import useEvents from '../hooks/useEvents'
import useDarkMode from '../hooks/useDarkMode'
import Toolbar from '../components/toolbar'
import Controls from '../components/controls'

export default function Home() {
  useEvents()
  useDarkMode()
  const marks = useSelector(state => state.data.marks)
  const currentMark = useSelector(state => state.data.currentMark)
  const darkMode = useSelector(state => state.data.settings.darkMode)
  const showControls = useSelector(state => state.data.settings.showControls)
  const showTrace = useSelector(state => state.data.settings.showTrace)
  const ref = React.useRef<SVGSVGElement>(null)

  React.useEffect(() => {
    function resize() {
      const svg = ref.current!
      svg.setAttribute('width', String(window.innerWidth))
      svg.setAttribute('height', String(window.innerHeight))
      svg.setAttribute(
        'viewBox',
        `0 0 ${String(window.innerWidth)} ${String(window.innerHeight)}`
      )
    }
    resize()
    if (typeof window !== undefined) {
      window.addEventListener('resize', resize)
      return () => {
        window.removeEventListener('resize', resize)
      }
    }
  }, [])

  return (
    <div>
      <Head>
        <title>Perfect Freehand Example</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main>
        <svg ref={ref} viewBox={'0 0 800 600'}>
          {marks.map((mark, i) => (
            <path
              key={i}
              d={mark.path}
              strokeWidth={2}
              stroke={darkMode ? '#fff' : '#000'}
              fill={showTrace ? 'transparent' : darkMode ? '#fff' : '#000'}
            />
          ))}
          {currentMark && (
            <path
              d={currentMark.path}
              strokeWidth={2}
              stroke={darkMode ? '#fff' : '#000'}
              fill={showTrace ? 'transparent' : darkMode ? '#fff' : '#000'}
            />
          )}
        </svg>
        {showControls && <Controls />}
        <Toolbar />
      </main>
    </div>
  )
}
