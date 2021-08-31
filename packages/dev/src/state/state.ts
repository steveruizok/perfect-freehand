import * as React from 'react'
import type { Doc, DrawStyles, State } from 'types'
import {
  TLPinchEventHandler,
  TLPointerEventHandler,
  TLWheelEventHandler,
  Utils,
  Vec,
} from '@tldraw/core'
import { StateManager } from 'rko'
import { Draw } from './shapes'
import type { StateSelector } from 'zustand'
import { copyTextToClipboard, pointInPolygon } from './utils'

export const shapeUtils = {
  draw: new Draw(),
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

export const defaultStyle = {
  size: 20,
  strokeWidth: 0,
  thinning: 0.8,
  streamline: 0.5,
  smoothing: 0.5,
  taperStart: 0,
  taperEnd: 0,
  capStart: true,
  capEnd: true,
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
        this.createShape(info.point)
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
          this.updateShape(info.point, info.pressure)
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

  onPointerUp: TLPointerEventHandler = (info) => {
    const { state } = this
    switch (state.appState.tool) {
      case 'drawing': {
        this.completeShape(info.point, info.pressure)
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

  onPinchEnd: TLPinchEventHandler = () => {
    this.patchState({
      appState: { status: 'idle' },
    })
  }

  onPinch: TLPinchEventHandler = ({ point, delta }, e) => {
    if (this.state.appState.status !== 'pinching') return

    const { camera } = this.state.pageState
    const zoomDelta = delta[2] / 350
    const nextPoint = Vec.add(camera.point, Vec.div(delta, camera.zoom))
    const nextZoom = Utils.clamp(camera.zoom - zoomDelta * camera.zoom, 0.25, 5)
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
      const camera = state.pageState.camera
      const pt = Vec.sub(Vec.div(info.point, camera.zoom), point)

      return this.patchState({
        pageState: {
          camera: {
            point,
          },
        },
        page: {
          shapes: {
            [shape.id]: {
              points: [...shape.points, [...Vec.sub(pt, shape.point), 0.5]],
            },
          },
        },
      })
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

  createShape = (point: number[]) => {
    const { state } = this
    const camera = state.pageState.camera
    const pt = Vec.sub(Vec.div(point, camera.zoom), camera.point)
    const shape = shapeUtils.draw.create({
      id: Utils.uniqueId(),
      point: pt,
      style: state.appState.style,
      points: [
        [0, 0, 0.5],
        [0, 0, 0.5],
      ],
    })

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

  updateShape = (point: number[], pressure: number) => {
    const { state } = this
    if (state.appState.status !== 'drawing') return this
    if (!state.appState.editingId) return this // Don't erase while drawing

    const shape = state.page.shapes[state.appState.editingId]
    const camera = state.pageState.camera
    const pt = Vec.sub(Vec.div(point, camera.zoom), camera.point)

    return this.patchState({
      page: {
        shapes: {
          [shape.id]: {
            points: [...shape.points, [...Vec.sub(pt, shape.point), pressure]],
          },
        },
      },
    })
  }

  completeShape = (point: number[], pressure: number) => {
    const { state } = this
    const { shapes } = state.page
    if (!state.appState.editingId) return this // Don't erase while drawing

    let shape = shapes[state.appState.editingId]
    const camera = state.pageState.camera
    const pt = Vec.sub(Vec.div(point, camera.zoom), camera.point)

    shape.isDone = true
    shape.points = [...shape.points, [...Vec.sub(pt, shape.point), pressure]]
    shape = {
      ...shape,
      ...shapeUtils.draw.onSessionComplete(shape),
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
                const points = shapeUtils.draw.strokeCache.get(shape)

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

    if (shapes.length === 0) return this

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
              Object.entries(shapes).map(([id, shape]) => [
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

  deleteAll = () => {
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
export function useAppState(selector?: StateSelector<State, any>) {
  if (selector) {
    return app.useStore(selector)
  }
  return app.useStore()
}
