import Head from 'next/head'
import dynamic from 'next/dynamic'
import * as React from 'react'
import { useSelector } from '../state'
import useEvents from '../hooks/useEvents'
import useLocalData from '../hooks/useLocalData'
import useDarkMode from '../hooks/useDarkMode'
import useSvgResizer from 'hooks/useSvgResizer'
import * as svg from 'svg'
import * as vec from 'vec'
import { getSegmentSegmentIntersection } from 'utils'
const Toolbar = dynamic(() => import('../components/toolbar'), { ssr: false })

const sets = [
  // [
  //   [100, 100, 30],
  //   [100, 200, 50],
  //   [100, 300, 30],
  // ],
  // [
  //   [300, 100, 30],
  //   [300, 200, 50],
  //   [400, 300, 30],
  // ],
  [
    [100, 100, 30],
    [100, 150, 30],
    [100, 200, 30],
    [200, 200, 30],
    [250, 300, 30],
    [200, 300, 30],
    [190, 300, 30],
    [180, 310, 30],
    [175, 320, 30],
    [170, 330, 30],
    // [160, 340, 30],
    // [150, 360, 30],
  ],
]

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

  return (
    <div className="app">
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
          {sets.map((points, k) => {
            // Path for set
            const [first, ...rest] = points
            const path = [svg.moveTo(first)]
            for (let point of rest) {
              path.push(svg.lineTo(point))
            }

            // Path for set
            const lefts: number[][] = []
            const rights: number[][] = []

            // previous left or right point
            let l0: number[]
            let r0: number[]
            let l1: number[]
            let r1: number[]
            let rs0: number[][]
            let rs1: number[][]
            let ls0: number[][]
            let ls1: number[][]
            let dpr0: number
            let dpr1: number
            let vector0: number[]
            let vector1: number[]

            for (let i = 0; i < points.length; i++) {
              const p0 = points[i]
              const p1 = points[i + 1]

              ls0 = ls1
              rs0 = rs1
              dpr0 = dpr1
              vector0 = vector1

              if (i > 0) {
                // Project points from previous vector
                l0 = vec.add(p0, vec.mul(vec.per(vector0), p0[2]))
                r0 = vec.sub(p0, vec.mul(vec.per(vector0), p0[2]))
                lefts.push(l0)
                rights.push(r0)
                ls1 = [l1, l0]
                rs1 = [r1, r0]
              }

              if (i < points.length - 1) {
                vector1 = vec.uni(vec.vec(p0, p1))
                l1 = vec.add(p0, vec.mul(vec.per(vector1), p0[2]))
                r1 = vec.sub(p0, vec.mul(vec.per(vector1), p0[2]))

                lefts.push(l1)
                rights.push(r1)
              }

              if (vector0 && vector1) {
                dpr1 = vec.dpr(vector0, vector1)
              }

              if (ls0 && ls1) {
                // Check for intersections?
                const li = getSegmentSegmentIntersection(
                  ls0[0],
                  ls0[1],
                  ls1[0],
                  ls1[1]
                )

                if (li) {
                  // lefts.splice(lefts.length - 4, 2, li)
                }

                const ri = getSegmentSegmentIntersection(
                  rs0[0],
                  rs0[1],
                  rs1[0],
                  rs1[1]
                )

                if (ri) {
                  // rights.splice(rights.length - 3, 2, ri)
                }
              }
            }
            return (
              <>
                <path d={path.join(' ')} fill="none" stroke="black" />
                {points.map((pt, i) => (
                  <circle key={k + ',' + i} cx={pt[0]} cy={pt[1]} r={3} />
                ))}
                <polyline
                  points={lefts.join(' ')}
                  stroke="dodgerBlue"
                  fill="none"
                />
                <polyline
                  points={rights.join(' ')}
                  stroke="orange"
                  fill="none"
                />
                <path d={lefts.map(svg.dot).join(' ')} fill="dodgerBlue" />
                <path d={rights.map(svg.dot).join(' ')} fill="orange" />
              </>
            )
          })}
          <g transform="translate(0, 250)">
            {sets.map((set, k) => {
              const pts = getPathFromPoints(set)
              return (
                <polyline
                  key={'2' + k}
                  points={pts.join(' ')}
                  stroke="blue"
                  fill="none"
                />
              )
            })}
          </g>
          <g>
            {marks.map((mark, k) => {
              const pts = getPathFromPoints(
                mark.points.map(({ x, y, pressure }) => [x, y, pressure * 10])
              )
              return (
                <polyline
                  key={'3' + k}
                  points={pts.join(' ')}
                  stroke="blue"
                  fill="none"
                />
              )
            })}
          </g>
          <g>
            {currentMark &&
              [currentMark].map((mark, k) => {
                const pts = getPathFromPoints(
                  mark.points.map(({ x, y, pressure }) => [x, y, pressure * 10])
                )
                return (
                  <polyline
                    key={'4' + k}
                    points={pts.join(' ')}
                    stroke="blue"
                    fill="none"
                  />
                )
              })}
          </g>
        </svg>
        <Toolbar />
      </main>
    </div>
  )
}
const MIN_DIST = 6

function getPathFromPoints(points: number[][]) {
  // Path for set
  let lefts: number[][] = []
  let rights: number[][] = []

  // previous left or right point
  let l0: number[]
  let r0: number[]
  let l1: number[]
  let r1: number[]
  let rs0: number[][]
  let rs1: number[][]
  let ls0: number[][]
  let ls1: number[][]
  let dpr0: number
  let dpr1: number
  let vector0: number[]
  let vector1: number[]

  let prev = points[0]
  let streamlined = [prev]

  for (let i = 1; i < points.length; i++) {
    prev = vec.lrp(prev, points[i], 0.9)
    streamlined.push([...prev, points[i][2]])
  }

  prev = streamlined[0]

  for (let i = 0; i < streamlined.length; i++) {
    const p0 = streamlined[i]
    const p1 = streamlined[i + 1]

    ls0 = ls1
    rs0 = rs1
    dpr0 = dpr1
    vector0 = vector1

    if (i > 0) {
      // Project points from previous vector
      // l0 = vec.add(p0, vec.mul(vec.per(vector0), p0[2]))
      // r0 = vec.sub(p0, vec.mul(vec.per(vector0), p0[2]))
      // lefts.push(l0)
      // rights.push(r0)
      // ls1 = [l1, l0]
      // rs1 = [r1, r0]
    }

    if (i === streamlined.length - 1 && vector0) {
      l0 = vec.add(p0, vec.mul(vec.per(vector0), p0[2]))
      r0 = vec.sub(p0, vec.mul(vec.per(vector0), p0[2]))
      lefts.push(l0)
      rights.push(r0)
      ls1 = [l1, l0]
      rs1 = [r1, r0]
    } else if (i < streamlined.length - 1) {
      const v = vec.uni(vec.vec(p0, p1))
      if (vector0 === undefined) {
        prev = p0
        vector1 = v

        l1 = vec.add(p0, vec.mul(vec.per(v), p0[2]))
        r1 = vec.sub(p0, vec.mul(vec.per(v), p0[2]))

        lefts.push(l1)
        rights.push(r1)
      } else {
        const dist = vec.dist(prev, p0)
        const dpr = vec.dpr(vector1, v)

        if (dist > MIN_DIST - dpr * MIN_DIST) {
          // draw an end cap
          if (dpr < 0) {
            if (vec.ang(prev, p0) > 0) {
              // lefts.push(vec.add(prev, vec.mul(vector0, prev[2])))
              // lefts.push(r1)
              // rights.push(vec.sub(prev, vec.mul(vector0, prev[2])))
              // rights.push(l1)
              // find the nearest right to l1?
            } else {
              // rights.push(vec.add(prev, vec.mul(vector0, prev[2])))
              // find the nearest right to l1?
            }
            // rights.push(l1)
            // rights.push(l1)
            // for (let i = 0; i < 5; i++) {
            //   lefts.push(vec.rotWith(l1, prev, (i * Math.PI) / 5))
            //   rights.push(vec.rotWith(r1, prev, (i * Math.PI) / 5))
            // }
          }

          prev = p0
          vector1 = v
          l0 = l1
          r0 = r1
          l1 = vec.add(p0, vec.mul(vec.per(v), p0[2]))
          r1 = vec.sub(p0, vec.mul(vec.per(v), p0[2]))

          lefts.push(l1)
          rights.push(r1)
        }
      }
    }

    // if (ls0 && ls1) {
    //   // Check for intersections?
    //   const li = getSegmentSegmentIntersection(ls0[0], ls0[1], ls1[0], ls1[1])

    //   if (li) {
    //     lefts.splice(lefts.length - 4, 2, li)
    //   }

    //   const ri = getSegmentSegmentIntersection(rs0[0], rs0[1], rs1[0], rs1[1])

    //   if (ri) {
    //     rights.splice(rights.length - 4, 2, ri)
    //   }
    // }
  }

  let v0: number[]
  let v1: number[]

  // lefts = lefts.reduce<number[][]>((acc, pt, i) => {
  //   if (i === 0) {
  //     acc.push(pt)
  //   } else {
  //     const p0 = acc[acc.length - 1]
  //     v1 = vec.uni(vec.vec(p0, pt))
  //     // if (v0 !== undefined) {
  //     //   console.log(
  //     //     vec.dist(p0, pt),
  //     //     MIN_DIST / 2 + (MIN_DIST - vec.dpr(v0, v1) * MIN_DIST) / 2
  //     //   )
  //     // }
  //     if (
  //       v0 === undefined ||
  //       vec.dist(p0, pt) >
  //         MIN_DIST / 2 + (MIN_DIST - vec.dpr(v0, v1) * MIN_DIST) / 2
  //     ) {
  //       v0 = v1
  //       acc.push(pt)
  //     }
  //   }
  //   return acc
  // }, [])

  // v0 = undefined

  // rights = rights.reverse().reduce<number[][]>((acc, pt, i) => {
  //   if (i === 0) {
  //     acc.push(pt)
  //   } else {
  //     const p0 = acc[acc.length - 1]
  //     v1 = vec.uni(vec.vec(p0, pt))
  //     if (
  //       v0 === undefined ||
  //       vec.dist(p0, pt) > MIN_DIST - vec.dpr(v0, v1) * MIN_DIST
  //     ) {
  //       v0 = v1
  //       acc.push(pt)
  //     }
  //   }

  //   return acc
  // }, [])

  rights.reverse()

  return [...lefts, ...rights, lefts[0]]
}
