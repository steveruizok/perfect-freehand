import * as React from 'react'
import type { Doc, DrawShape, DrawStyles, State } from 'types'
import {
  TLPinchEventHandler,
  TLPointerEventHandler,
  TLShapeUtilsMap,
  TLWheelEventHandler,
  Utils,
} from '@tldraw/core'
import { Vec } from '@tldraw/vec'
import { StateManager } from 'rko'
import { draw, DrawUtil } from './shapes'
import sample from './sample.json'
import type { StateSelector } from 'zustand'
import { copyTextToClipboard, pointInPolygon } from './utils'
import { EASING_STRINGS } from './easings'

export const shapeUtils: TLShapeUtilsMap<DrawShape> = {
  draw: new DrawUtil(),
}

export const initialDoc: Doc = {
  page: {
    id: 'page',
    shapes: {},
    bindings: {},
  },
  pageState: {
    id: 'page',
    selectedIds: [],
    camera: {
      point: [0, 0],
      zoom: 1,
    },
  },
}

export const defaultStyle: DrawStyles = {
  size: 16,
  strokeWidth: 0,
  thinning: 0.5,
  streamline: 0.5,
  smoothing: 0.5,
  easing: 'linear',
  taperStart: 0,
  taperEnd: 0,
  capStart: true,
  capEnd: true,
  easingStart: 'linear',
  easingEnd: 'linear',
  isFilled: true,
  fill: '#000000',
  stroke: '#000000',
}

export const initialState: State = {
  appState: {
    status: 'idle',
    tool: 'drawing',
    editingId: undefined,
    style: defaultStyle,
    isPanelOpen: true,
  },
  ...initialDoc,
}

export const context = React.createContext<AppState>({} as AppState)

export class AppState extends StateManager<State> {
  shapeUtils = shapeUtils

  log = false

  currentStroke = {
    startTime: 0,
  }

  onReady = () => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    window['app'] = this

    if (Object.values(this.state.page.shapes).length === 0) {
      this.addShape({ id: 'sample', points: sample })
      this.centerShape('sample')
    }
  }

  cleanup = (state: State) => {
    for (const id in state.page.shapes) {
      if (!state.page.shapes[id]) {
        delete state.page.shapes[id]
      }
    }

    return state
  }

  onPointerDown: TLPointerEventHandler = (info) => {
    const { state } = this

    switch (state.appState.tool) {
      case 'drawing': {
        this.createDrawingShape(info.point)
        break
      }
      case 'erasing': {
        this.setSnapshot()
        this.patchState({
          appState: {
            status: 'erasing',
          },
        })
        this.erase(info.point)
        break
      }
    }
  }

  onPointerMove: TLPointerEventHandler = (info, event) => {
    if (event.buttons > 1) return

    const { status, tool } = this.state.appState

    switch (tool) {
      case 'drawing': {
        if (status === 'drawing') {
          const nextShape = this.updateDrawingShape(info.point, info.pressure)
          if (nextShape) {
            this.patchState({
              page: {
                shapes: {
                  [nextShape.id]: nextShape,
                },
              },
            })
          }
        }
        break
      }
      case 'erasing': {
        if (status === 'erasing') {
          this.erase(info.point)
        }
        break
      }
    }
  }

  onPointerUp: TLPointerEventHandler = () => {
    const { state } = this
    switch (state.appState.tool) {
      case 'drawing': {
        this.completeDrawingShape()
        break
      }
      case 'erasing': {
        this.setState({
          before: this.snapshot,
          after: {
            appState: {
              status: 'idle',
            },
            page: {
              shapes: this.state.page.shapes,
            },
          },
        })
        break
      }
    }
  }

  pinchZoom = (point: number[], delta: number[], zoom: number): this => {
    const { camera } = this.state.pageState
    const nextPoint = Vec.sub(camera.point, Vec.div(delta, camera.zoom))
    const nextZoom = zoom
    const p0 = Vec.sub(Vec.div(point, camera.zoom), nextPoint)
    const p1 = Vec.sub(Vec.div(point, nextZoom), nextPoint)

    return this.patchState({
      pageState: {
        camera: {
          point: Vec.round(Vec.add(nextPoint, Vec.sub(p1, p0))),
          zoom: nextZoom,
        },
      },
    })
  }

  onPinchEnd: TLPinchEventHandler = () => {
    this.patchState({
      appState: { status: 'idle' },
    })
  }

  onPinch: TLPinchEventHandler = (info, e) => {
    if (this.state.appState.status !== 'pinching') return
    this.pinchZoom(info.point, info.delta, info.delta[2])
    this.onPointerMove?.(info, e as unknown as React.PointerEvent)
  }

  onPan: TLWheelEventHandler = (info) => {
    const { state } = this
    if (state.appState.status === 'pinching') return this

    const { camera } = state.pageState
    const delta = Vec.div(info.delta, camera.zoom)
    const prev = camera.point
    const next = Vec.sub(prev, delta)

    if (Vec.isEqual(next, prev)) return this

    const point = Vec.round(next)

    if (state.appState.editingId && state.appState.status === 'drawing') {
      const shape = state.page.shapes[state.appState.editingId]
      const nextShape = this.updateDrawingShape(info.point, info.pressure)

      this.patchState({
        pageState: {
          camera: {
            point,
          },
        },
        page: {
          shapes: {
            [shape.id]: nextShape,
          },
        },
      })

      if (nextShape) {
        this.patchState({
          page: {
            shapes: {
              [nextShape.id]: nextShape,
            },
          },
        })
      }
    }

    return this.patchState({
      pageState: {
        camera: {
          point,
        },
      },
    })
  }

  /* --------------------- Methods -------------------- */

  togglePanelOpen = () => {
    const { state } = this
    this.patchState({
      appState: {
        isPanelOpen: !state.appState.isPanelOpen,
      },
    })
  }

  createDrawingShape = (point: number[]) => {
    const { state } = this

    const camera = state.pageState.camera

    const pt = Vec.sub(Vec.div(point, camera.zoom), camera.point)

    const shape = draw.create({
      id: Utils.uniqueId(),
      point: pt,
      style: state.appState.style,
      points: [[0, 0, 0.5, 0]],
      isDone: false,
    })

    this.currentStroke.startTime = Date.now()

    return this.patchState({
      appState: {
        status: 'drawing',
        editingId: shape.id,
      },
      page: {
        shapes: {
          [shape.id]: shape,
        },
      },
    })
  }

  updateDrawingShape = (point: number[], pressure: number) => {
    const { state, currentStroke } = this
    if (state.appState.status !== 'drawing') return
    if (!state.appState.editingId) return

    const shape = state.page.shapes[state.appState.editingId]

    const camera = state.pageState.camera

    const newPoint = [
      ...Vec.sub(
        Vec.round(Vec.sub(Vec.div(point, camera.zoom), camera.point)),
        shape.point
      ),
      pressure,
      Date.now() - currentStroke.startTime,
    ]

    let shapePoint = shape.point

    let shapePoints = [...shape.points, newPoint]

    // Does the new point create a negative offset?
    const offset = [Math.min(newPoint[0], 0), Math.min(newPoint[1], 0)]

    if (offset[0] < 0 || offset[1] < 0) {
      // If so, then we need to move the shape to cancel the offset
      shapePoint = [
        ...Vec.round(Vec.add(shapePoint, offset)),
        shapePoint[2],
        shapePoint[3],
      ]

      // And we need to move the shape points to cancel the offset
      shapePoints = shapePoints.map((pt) =>
        Vec.round(Vec.sub(pt, offset)).concat(pt[2], pt[3])
      )
    }

    return {
      id: shape.id,
      point: shapePoint,
      points: shapePoints,
    }
  }

  completeDrawingShape = () => {
    const { state } = this
    const { shapes } = state.page
    if (!state.appState.editingId) return this // Don't erase while drawing

    let shape = shapes[state.appState.editingId]

    shape.isDone = true

    shape = {
      ...shape,
    }

    return this.setState({
      before: {
        appState: {
          status: 'idle',
          editingId: undefined,
        },
        page: {
          shapes: {
            [shape.id]: undefined,
          },
        },
      },
      after: {
        appState: {
          status: 'idle',
          editingId: undefined,
        },
        page: {
          shapes: {
            [shape.id]: shape,
          },
        },
      },
    })
  }

  centerShape = (id: string) => {
    const shape = this.state.page.shapes[id]
    const bounds = shapeUtils.draw.getBounds(this.state.page.shapes[id])
    this.patchState({
      pageState: {
        camera: {
          point: Vec.add(shape.point, [
            window.innerWidth / 2 - bounds.width / 2,
            window.innerHeight / 2 - bounds.height / 2,
          ]),
          zoom: 1,
        },
      },
    })
  }

  replayShape = (points: number[][]) => {
    this.eraseAll()

    const newShape = draw.create({
      id: Utils.uniqueId(),
      parentId: 'page',
      childIndex: 1,
      point: [0, 0],
      points: [],
      style: this.state.appState.style,
    })

    this.patchState({
      page: {
        shapes: {
          [newShape.id]: newShape,
        },
      },
    })

    this.centerShape(newShape.id)

    points
      .map((pt, i) => [...Vec.sub(pt, newShape.point), pt[2], pt[3] || i * 10])
      .forEach((pt, i) => {
        setTimeout(() => {
          this.patchState({
            page: {
              shapes: {
                [newShape.id]: {
                  points: points.slice(0, i),
                },
              },
            },
          })
        }, pt[3] * 20)
      })
  }

  addShape = (shape: Partial<DrawShape>) => {
    const newShape = draw.create({
      id: Utils.uniqueId(),
      parentId: 'page',
      childIndex: 1,
      point: [0, 0],
      points: [],
      style: this.state.appState.style,
      ...shape,
    })

    const bounds = Utils.getBoundsFromPoints(newShape.points)

    const topLeft = [bounds.minX, bounds.minY]

    newShape.points = newShape.points.map((pt, i) =>
      Vec.sub(pt, topLeft).concat(pt[2] || 0.5, pt[3] || i * 10)
    )

    this.patchState({
      page: {
        shapes: {
          [newShape.id]: newShape,
        },
      },
    })

    this.persist()

    return newShape
  }

  erase = (point: number[]) => {
    const { state } = this
    const camera = state.pageState.camera
    const pt = Vec.sub(Vec.div(point, camera.zoom), camera.point)
    const { getBounds } = shapeUtils.draw

    return this.patchState({
      page: {
        shapes: {
          ...Object.fromEntries(
            Object.entries(state.page.shapes).map(([id, shape]) => {
              const bounds = getBounds(shape)

              if (Vec.dist(pt, shape.point) < 10) {
                return [id, undefined]
              }

              if (Utils.pointInBounds(pt, bounds)) {
                const points = draw.strokeCache.get(shape)

                if (
                  (points &&
                    pointInPolygon(Vec.sub(pt, shape.point), points)) ||
                  Vec.dist(pt, shape.point) < 10
                ) {
                  return [id, undefined]
                }
              }

              return [id, shape]
            })
          ),
        },
      },
    })
  }

  eraseAll = () => {
    const { state } = this
    const { shapes } = state.page

    if (state.appState.editingId) return this // Don't erase while drawing

    return this.setState({
      before: {
        page: {
          shapes,
        },
      },
      after: {
        page: {
          shapes: {},
        },
      },
    })
  }

  startStyleUpdate = () => {
    return this.setSnapshot()
  }

  patchStyleForAllShapes = (style: Partial<DrawStyles>) => {
    const { shapes } = this.state.page

    return this.patchState({
      appState: {
        style,
      },
      page: {
        shapes: {
          ...Object.fromEntries(
            Object.keys(shapes).map((id) => [id, { style }])
          ),
        },
      },
    })
  }

  patchStyle = (style: Partial<DrawStyles>) => {
    return this.patchState({
      appState: {
        style,
      },
    })
  }

  finishStyleUpdate = () => {
    const { state, snapshot } = this
    const { shapes } = state.page

    return this.setState({
      before: snapshot,
      after: {
        appState: {
          style: state.appState.style,
        },
        page: {
          shapes: {
            ...Object.fromEntries(
              Object.entries(shapes).map(([id, { style }]) => [id, { style }])
            ),
          },
        },
      },
    })
  }

  setNextStyleForAllShapes = (style: Partial<DrawStyles>) => {
    const { shapes } = this.state.page

    return this.setState({
      before: {
        appState: {
          style: Object.fromEntries(
            Object.keys(style).map((key) => [
              key,
              this.state.appState.style[key as keyof DrawStyles],
            ])
          ),
        },
        page: {
          shapes: {
            ...Object.fromEntries(
              Object.entries(shapes).map(([id, shape]) => [
                id,
                {
                  style: Object.fromEntries(
                    Object.keys(style).map((key) => [
                      key,
                      shape.style[key as keyof DrawStyles],
                    ])
                  ),
                },
              ])
            ),
          },
        },
      },
      after: {
        appState: {
          style,
        },
        page: {
          shapes: {
            ...Object.fromEntries(
              Object.keys(shapes).map((id) => [id, { style }])
            ),
          },
        },
      },
    })
  }

  resetStyle = (prop: keyof DrawStyles) => {
    const { shapes } = this.state.page
    const { state } = this

    const initialStyle = initialState.appState.style[prop]

    return this.setState({
      before: {
        appState: state.appState,
        page: {
          shapes: {
            ...Object.fromEntries(
              Object.entries(shapes).map(([id, shape]) => [
                id,
                {
                  style: { [prop]: shape.style[prop] },
                },
              ])
            ),
          },
        },
      },
      after: {
        appState: {
          style: { [prop]: initialStyle },
        },
        page: {
          shapes: {
            ...Object.fromEntries(
              Object.keys(shapes).map((id) => [id, { [prop]: initialStyle }])
            ),
          },
        },
      },
    })
  }

  zoomToContent = (): this => {
    const shapes = Object.values(this.state.page.shapes)
    const pageState = this.state.pageState

    if (shapes.length === 0) {
      this.patchState({
        pageState: {
          camera: {
            zoom: 1,
            point: [0, 0],
          },
        },
      })
    }

    const bounds = Utils.getCommonBounds(
      Object.values(shapes).map(shapeUtils.draw.getBounds)
    )

    const { zoom } = pageState.camera
    const mx = (window.innerWidth - bounds.width * zoom) / 2 / zoom
    const my = (window.innerHeight - bounds.height * zoom) / 2 / zoom
    const point = Vec.round(Vec.add([-bounds.minX, -bounds.minY], [mx, my]))

    return this.patchState({
      pageState: { camera: { point } },
    })
  }

  resetStyles = () => {
    const { shapes } = this.state.page
    const { state } = this

    const currentAppState = state.appState
    const initialAppState = initialState.appState

    return this.setState({
      before: {
        appState: currentAppState,
        page: {
          shapes: {
            ...Object.fromEntries(
              Object.keys(shapes).map((id) => [
                id,
                {
                  style: currentAppState.style,
                },
              ])
            ),
          },
        },
      },
      after: {
        appState: initialAppState,
        page: {
          shapes: {
            ...Object.fromEntries(
              Object.keys(shapes).map((id) => [
                id,
                { style: initialAppState.style },
              ])
            ),
          },
        },
        pageState: {
          camera: {
            zoom: 1,
          },
        },
      },
    })
  }

  copyStyles = () => {
    const { state } = this
    const { style } = state.appState
    copyTextToClipboard(`{
  size: ${style.size},
  smoothing: ${style.smoothing},
  thinning: ${style.thinning},
  streamline: ${style.streamline},
  easing: ${EASING_STRINGS[style.easing].toString()},
  start: {
    taper: ${style.taperStart},
    cap: ${style.capStart},
  },
  end: {
    taper: ${style.taperEnd},
    cap: ${style.capEnd},
  },
}`)
  }

  copySvg = () => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')

    const shapes = Object.values(this.state.page.shapes)

    const bounds = Utils.getCommonBounds(shapes.map(draw.getBounds))

    const padding = 40

    shapes.forEach((shape) => {
      const fillElm = document.getElementById('path_' + shape.id)

      if (!fillElm) return

      const fillClone = fillElm.cloneNode(false) as SVGPathElement

      const strokeElm = document.getElementById('path_stroke_' + shape.id)

      if (strokeElm) {
        // Create a new group
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g')

        // Translate the group to the shape's point
        g.setAttribute(
          'transform',
          `translate(${shape.point[0]}, ${shape.point[1]})`
        )

        // Clone the stroke element
        const strokeClone = strokeElm.cloneNode(false) as SVGPathElement

        // Append both the stroke element and the fill element to the group
        g.appendChild(strokeClone)
        g.appendChild(fillClone)

        // Append the group to the SVG
        svg.appendChild(g)
      } else {
        // Translate the fill clone and append it to the SVG
        fillClone.setAttribute(
          'transform',
          `translate(${shape.point[0]}, ${shape.point[1]})`
        )

        svg.appendChild(fillClone)
      }
    })

    // Resize the element to the bounding box
    svg.setAttribute(
      'viewBox',
      [
        bounds.minX - padding,
        bounds.minY - padding,
        bounds.width + padding * 2,
        bounds.height + padding * 2,
      ].join(' ')
    )

    svg.setAttribute('width', String(bounds.width))

    svg.setAttribute('height', String(bounds.height))

    const s = new XMLSerializer()

    const svgString = s
      .serializeToString(svg)
      .replaceAll('&#10;      ', '')
      .replaceAll(/((\s|")[0-9]*\.[0-9]{2})([0-9]*)(\b|"|\))/g, '$1')

    copyTextToClipboard(svgString)

    return svgString
  }

  resetDoc = () => {
    const { shapes } = this.state.page

    return this.setState({
      before: {
        page: {
          shapes,
        },
      },
      after: {
        page: {
          shapes: {
            ...Object.fromEntries(
              Object.keys(shapes).map((key) => [key, undefined])
            ),
          },
        },
        pageState: {
          camera: {
            point: [0, 0],
            zoom: 1,
          },
        },
      },
    })
  }

  onPinchStart: TLPinchEventHandler = () => {
    if (this.state.appState.status !== 'idle') return

    this.patchState({
      appState: { status: 'pinching' },
    })
  }

  selectDrawingTool = () => {
    this.patchState({
      appState: {
        tool: 'drawing',
      },
    })
  }

  selectErasingTool = () => {
    this.patchState({
      appState: {
        tool: 'erasing',
      },
    })
  }
}

export const app = new AppState(
  initialState,
  'perfect-freehand',
  1,
  (p, n) => n
)

export function useAppState(): State
export function useAppState<K>(selector: StateSelector<State, K>): K
export function useAppState<K>(selector?: StateSelector<State, K>) {
  if (selector) {
    return app.useStore(selector)
  }
  return app.useStore()
}
