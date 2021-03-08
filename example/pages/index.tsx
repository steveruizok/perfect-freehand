import Head from 'next/head'
import dynamic from 'next/dynamic'
import * as React from 'react'
import { useSelector } from '../state'
import useEvents from '../hooks/useEvents'
import useLocalData from '../hooks/useLocalData'
import useDarkMode from '../hooks/useDarkMode'
import useSvgResizer from 'hooks/useSvgResizer'
const Toolbar = dynamic(() => import('../components/toolbar'), { ssr: false })
const Controls = dynamic(() => import('../components/controls'), { ssr: false })
import { getStrokeOutlinePoints, getStrokePoints } from 'perfect-freehand'
import {
  getBezierCurveSegments,
  getSpline,
  getCurvePoints,
  getBSpline,
} from 'utils'

function handleTouchStart(e: React.TouchEvent) {
  e.preventDefault()
}

function handleTouchEnd(e: React.TouchEvent) {
  e.preventDefault()
}

export default function Home() {
  useEvents()
  useDarkMode()
  useLocalData()
  const ref = useSvgResizer()
  const marks = useSelector(state => state.data.marks)
  const currentMark = useSelector(state => state.data.currentMark)
  const showControls = useSelector(state => state.data.settings.showControls)
  const showTrace = useSelector(state => state.data.settings.showTrace)
  const darkMode = useSelector(state => state.data.settings.darkMode)

  const points = [
    [0, 100],
    [200, 200],
    [30, 250],
    [20, 400],
    [200, 450],
    [100, 200],
  ].map(([x, y]) => [x + 400, y])

  const spline = getBezierCurveSegments(points)

  const d = [`M ${spline[0].start.join(' ')} C`]

  for (let pt of spline) {
    d.push([...pt.tangentStart, ...pt.tangentEnd, ...pt.end].join(' '))
  }

  return (
    <div>
      <Head>
        <title>Perfect Freehand Example</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main>
        <svg
          ref={ref}
          viewBox={'0 0 800 600'}
          id="drawable-svg"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <g transform="translate(100,100)">
            <path
              d={d.join(' ')}
              strokeWidth={2}
              stroke="black"
              fill="transparent"
            />
            {spline.map(
              (
                {
                  start,
                  tangentStart,
                  tangentEnd,
                  end,
                  normalEnd,
                  normalStart,
                  pressureStart,
                  pressureEnd,
                },
                i
              ) => {
                const n0 = [normalStart[1], normalStart[0] * -1]
                const n1 = [normalEnd[1], normalEnd[0] * -1]

                // Left side
                const pl0 = [
                  start[0] + n0[0] * pressureStart * 10,
                  start[1] + n0[1] * pressureStart * 10,
                ]
                const cl0 = [
                  tangentStart[0] + n0[0] * pressureStart * 10,
                  tangentStart[1] + n0[1] * pressureStart * 10,
                ]
                const cl1 = [
                  tangentEnd[0] + n1[0] * pressureEnd * 10,
                  tangentEnd[1] + n1[1] * pressureEnd * 10,
                ]

                const pl1 = [
                  end[0] + n1[0] * pressureEnd * 10,
                  end[1] + n1[1] * pressureEnd * 10,
                ]

                // Right side
                const pr0 = [
                  start[0] + n0[0] * -pressureStart * 10,
                  start[1] + n0[1] * -pressureStart * 10,
                ]

                const cr0 = [
                  tangentStart[0] + n0[0] * -pressureStart * 10,
                  tangentStart[1] + n0[1] * -pressureStart * 10,
                ]

                const cr1 = [
                  tangentEnd[0] + n1[0] * -pressureEnd * 10,
                  tangentEnd[1] + n1[1] * -pressureEnd * 10,
                ]

                const pr1 = [
                  end[0] + n1[0] * -pressureEnd * 10,
                  end[1] + n1[1] * -pressureEnd * 10,
                ]

                const lPath = ['M', ...pl0, 'C', ...cl0, ...cl1, ...pl1].join(
                  ' '
                )
                const rPath = ['M', ...pr0, 'C', ...cr0, ...cr1, ...pr1].join(
                  ' '
                )
                return (
                  <g key={i}>
                    <line
                      x1={tangentStart[0]}
                      y1={tangentStart[1]}
                      x2={start[0]}
                      y2={start[1]}
                      stroke="red"
                    />
                    <line
                      x1={tangentEnd[0]}
                      y1={tangentEnd[1]}
                      x2={end[0]}
                      y2={end[1]}
                      stroke="red"
                    />
                    <circle
                      cx={tangentStart[0]}
                      cy={tangentStart[1]}
                      r={2}
                      stroke="red"
                      fill="white"
                    />
                    <circle
                      cx={tangentEnd[0]}
                      cy={tangentEnd[1]}
                      r={2}
                      stroke="red"
                      fill="white"
                    />
                    <circle
                      cx={pl0[0]}
                      cy={pl0[1]}
                      r={1}
                      stroke="orange"
                      fill="orange"
                    />
                    <circle
                      cx={pr0[0]}
                      cy={pr0[1]}
                      r={1}
                      stroke="orange"
                      fill="orange"
                    />
                    <line
                      x1={pl0[0]}
                      y1={pl0[1]}
                      x2={pr0[0]}
                      y2={pr0[1]}
                      stroke="black"
                      strokeWidth={1}
                    />
                    <path
                      d={lPath}
                      fill="transparent"
                      stroke="orange"
                      strokeWidth={1}
                    />
                    <path
                      d={rPath}
                      fill="transparent"
                      stroke="orange"
                      strokeWidth={1}
                    />
                  </g>
                )
              }
            )}
            {points.map(([x, y], i) => (
              <circle key={'p' + i} cx={x} cy={y} r={2} fill="blue" />
            ))}
          </g>
          {marks.map((mark, i) => {
            const outline = getStrokeOutlinePoints(getStrokePoints(mark.points))
            const bezier1 = getBezierCurveSegments(
              outline.slice(0, Math.floor(outline.length / 2) + 1)
            )

            const d1 = [`M ${bezier1[0].start.join(' ')} C`]

            for (let pt of bezier1) {
              d1.push(
                [...pt.tangentStart, ...pt.tangentEnd, ...pt.end].join(' ')
              )
            }

            const data1 = d1.join(' ')

            const bezier2 = getBezierCurveSegments(
              outline.slice(Math.floor(outline.length / 2))
            )

            const d2 = [`M ${bezier2[0].start.join(' ')} C`]

            for (let pt of bezier2) {
              d2.push(
                [...pt.tangentStart, ...pt.tangentEnd, ...pt.end].join(' ')
              )
            }

            const data2 = d2.join(' ')

            return (
              <g key={i}>
                <path d={data1} strokeWidth={2} stroke="black" fill="none" />
                <path d={data2} strokeWidth={2} stroke="red" fill="none" />
              </g>
              // <path
              //   key={i}
              //   d={mark.path}
              //   strokeWidth={2}
              //   stroke={darkMode ? '#fff' : '#000'}
              //   fill={showTrace ? 'transparent' : darkMode ? '#fff' : '#000'}
              // />
            )
          })}
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
