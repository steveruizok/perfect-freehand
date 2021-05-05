import { createState, createSelectorHook } from '@state-designer/react'
import { v4 as uuid } from 'uuid'
import { getPointer } from './hooks/useEvents'
import { Mark, ClipboardMessage } from './types'
import getStroke from 'perfect-freehand'
import polygonClipping from 'polygon-clipping'
import { copyToClipboard } from './utils'
import { bezier } from '@leva-ui/plugin-bezier'
import * as svg from 'svg'
import * as vec from 'vec'

function getSvgPathFromStroke(stroke: number[][]) {
  const d = []

  if (stroke.length < 3) {
    return ''
  }

  let p0 = stroke[stroke.length - 3]
  let p1 = stroke[stroke.length - 2]

  d.push('M', p0[0], p0[1], 'Q')

  for (let i = 0; i < stroke.length; i++) {
    d.push(p0[0], p0[1], (p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2)
    p0 = p1
    p1 = stroke[i]
  }

  d.push('Z')

  // d.length = 0

  // for (let i = 0; i < stroke.length; i++) {
  //   const pt = stroke[i]
  //   d.push(svg.dot(pt, i > stroke.length / 2 ? 1 : 1.5))
  // }

  return d.join(' ')
}

function getFlatSvgPathFromStroke(stroke: number[][]) {
  const poly = polygonClipping.union([stroke] as any)

  const d = []

  for (let face of poly) {
    for (let points of face) {
      d.push(getSvgPathFromStroke(points))
    }
  }

  return d.join(' ')
}

function getStrokePath(
  mark: Mark,
  simulatePressure: boolean,
  options: AppOptions,
  last: boolean
) {
  const stroke = getStroke(mark.points, {
    ...options,
    easing: options.easing.evaluate,
    simulatePressure,
    start: {
      taper: options.taperStart,
      easing: options.taperStartEasing.evaluate,
    },
    end: {
      taper: options.taperEnd,
      easing: options.taperEndEasing.evaluate,
    },
    last,
  })

  const path = options.clip
    ? getFlatSvgPathFromStroke(stroke)
    : getSvgPathFromStroke(stroke)

  return path
}

interface Easing {
  0: number
  1: number
  2: number
  3: number
  evaluate: (t: number) => number
}

interface AppOptions {
  size: number
  streamline: number
  clip: boolean
  easing: Easing
  thinning: number
  smoothing: number
  simulatePressure: boolean
  taperStart: number
  taperStartEasing: Easing
  taperEnd: number
  taperEndEasing: Easing
}

const defaultOptions: AppOptions = {
  size: 24,
  thinning: 0.5,
  smoothing: 0.5,
  streamline: 0.5,
  simulatePressure: true,
  clip: false,
  easing: {
    0: 0.25,
    1: 0.25,
    2: 0.75,
    3: 0.75,
    evaluate: t => t,
  },
  taperStart: 0,
  taperEnd: 0,
  taperStartEasing: {
    0: 0.25,
    1: 0.25,
    2: 0.75,
    3: 0.75,
    evaluate: t => t,
  },
  taperEndEasing: {
    0: 0.25,
    1: 0.25,
    2: 0.75,
    3: 0.75,
    evaluate: t => t,
  },
}

const defaultSettings = {
  penMode: false,
  darkMode: false,
  showTrace: false,
  showControls: false,
  recomputePaths: true,
}

const state = createState({
  data: {
    settings: { ...defaultSettings },
    alg: { ...defaultOptions },
    restore: [] as { clear?: boolean; marks: Mark[] }[],
    redos: [] as { clear?: boolean; marks: Mark[] }[],
    marks: [] as Mark[],
    currentMark: null as Mark | null,
    clipboardMessage: null as ClipboardMessage | null,
    lastPressure: 0,
  },
  states: {
    app: {
      initial: 'idle',
      states: {
        idle: {
          on: {
            RESET_OPTIONS: ['resetOptions', 'updatePaths'],
            CHANGED_OPTIONS: ['changeOptions', 'updatePaths'],
            CHANGED_SETTINGS: ['changeSettings'],
            TOGGLED_CONTROLS: 'toggleControls',
            EXITED_PEN_MODE: 'clearPenMode',
            LOADED: ['setup', 'setDarkMode'],
            CLEARED_CANVAS: ['clearMarks'],
            UNLOADED: 'cleanup',
            RESIZED: ['resize'],
            UNDO: ['undoMark'],
            REDO: ['redoMark'],
            TOGGLED_DARK_MODE: ['toggleDarkMode', 'setDarkMode'],
            CLEARED_CLIPBOARD_MESSAGE: 'clearClipboardMessage',
            COPIED_TO_CLIPBOARD: [
              {
                get: 'svgElement',
                if: 'hasResult',
                to: 'copying',
                else: 'alertCouldNotCopyToClipboard',
              },
            ],
            PRESSED_KEY_D: 'toggledTrace',
            PRESSED_KEY_E: ['clearMarks'],
            PRESSED_KEY_Z: [
              { if: ['metaPressed', 'shiftPressed'], do: 'redoMark' },
              { if: 'metaPressed', unless: 'shiftPressed', do: 'undoMark' },
            ],
          },
        },
        copying: {
          async: {
            await: 'copySvgToClipboard',
            onResolve: {
              do: 'alertCopiedToClipboard',
              to: 'idle',
            },
            onReject: {
              do: [
                () => window.alert('no api'),
                'alertCouldNotCopyToClipboard',
              ],
              to: 'idle',
            },
          },
        },
      },
    },
    pointer: {
      initial: 'up',
      states: {
        up: {
          on: {
            DOWNED_POINTER: [
              { if: 'inPenMode', unless: 'hasPressure', break: true },
              { if: 'hasPressure', unless: 'inPenMode', do: 'setPenMode' },
              { do: 'beginMark', to: 'down' },
            ],
          },
        },
        down: {
          on: {
            LIFTED_POINTER: { do: 'completeMark', to: 'up' },
            MOVED_POINTER: [
              { if: 'hasPressure', unless: 'inPenMode', do: 'setPenMode' },
              'addPointToMark',
            ],
          },
        },
      },
    },
  },
  onEnter: { do: 'setDarkMode' },
  results: {
    svgElement() {
      return document.getElementById('drawable-svg')
    },
  },
  conditions: {
    hasPressure() {
      const { p, type } = getPointer()
      return type === 'pen' || p !== 0
    },
    inPenMode(data) {
      return data.settings.penMode
    },
    hasCurrentMark(data) {
      return !!data.currentMark
    },
    hasResult(data, paylad, result) {
      return !!result
    },
    shiftPressed(data, payload) {
      return payload.keys.shift
    },
    metaPressed(data, payload) {
      return payload.keys.meta
    },
  },
  actions: {
    resetOptions(data) {
      data.alg = { ...defaultOptions }
    },
    changeOptions(data, payload) {
      data.alg = { ...data.alg, ...payload }
    },
    changeSettings(data, payload) {
      data.settings = { ...data.settings, ...payload }
    },
    toggleControls(data) {
      data.settings.showControls = !data.settings.showControls
    },
    toggledTrace(data) {
      data.settings.showTrace = !data.settings.showTrace
    },
    setPenMode(data) {
      data.settings.penMode = true
    },
    clearPenMode(data) {
      data.settings.penMode = false
    },
    setup(
      data,
      payload: {
        marks: Mark[]
        alg: typeof defaultOptions
        settings: typeof defaultSettings
      }
    ) {
      const { marks, alg, settings } = payload

      data.alg = { ...data.alg, ...alg }

      data.marks = marks.map(mark => ({
        ...mark,
        path: getStrokePath(mark, mark.simulatePressure, alg, true),
      }))

      data.settings = {
        ...data.settings,
        ...settings,
        penMode: false,
      }
    },
    cleanup(data) {},
    resize(data) {},
    beginMark(data) {
      const { alg } = data
      const { x, y, p, type } = getPointer()

      data.redos = []

      data.lastPressure = p

      const point = {
        x,
        y,
        pressure: p,
      }

      data.currentMark = {
        id: uuid(),
        simulatePressure: true,
        points: [point],
        path: '',
      }

      data.currentMark.path = getStrokePath(data.currentMark, true, alg, false)
    },
    addPointToMark(data) {
      const { x, y, p } = getPointer()
      const { currentMark, alg, settings } = data

      data.lastPressure = p

      currentMark!.simulatePressure = !settings.penMode

      currentMark!.points.push({
        x,
        y,
        pressure: p,
      })

      currentMark!.path = getStrokePath(
        currentMark!,
        currentMark!.simulatePressure,
        alg,
        false
      )
    },
    completeMark(data) {
      const { currentMark, alg } = data

      if (!currentMark) return

      data.marks.push({
        ...currentMark,
        path: getStrokePath(
          currentMark!,
          currentMark!.simulatePressure,
          alg,
          true
        ),
      })

      data.currentMark = null
    },
    clearMarks(data) {
      data.marks = []
      data.redos = []
    },
    loadData(data, payload: { marks: Mark[] }) {
      const { alg } = data
      data.marks = payload.marks.map(mark => ({
        ...mark,
        id: uuid(),
        path: getStrokePath(mark, mark.simulatePressure, alg, true),
      }))
    },
    undoMark(data) {
      if (data.marks.length === 0) {
        const restored = data.restore.pop()
        if (restored) data.marks = restored.marks
        return
      }

      const undid = data.marks.pop()
      if (undid) {
        data.redos.push({ marks: [undid] })
      }
    },
    redoMark(data) {
      const undid = data.redos.pop()
      if (undid) {
        data.marks.push(...undid.marks)
      }
    },
    toggleDarkMode(data) {
      data.settings.darkMode = !data.settings.darkMode
    },
    setDarkMode(data) {
      if (typeof document === 'undefined') return

      if (data.settings.darkMode) {
        document.body.classList.add('dark')
      } else {
        document.body.classList.remove('dark')
      }
    },
    updatePaths(data) {
      const { currentMark, alg, marks } = data
      for (let mark of marks) {
        mark.path = getStrokePath(mark, mark.simulatePressure, alg, true)
      }

      if (currentMark) {
        currentMark.path = getStrokePath(
          currentMark,
          currentMark.simulatePressure,
          alg,
          false
        )
      }
    },
    // Clipboard message
    alertCopiedToClipboard(data) {
      data.clipboardMessage = {
        error: false,
        message: `Copied SVG`,
      }
    },
    alertCouldNotCopyToClipboard(data) {
      data.clipboardMessage = {
        error: false,
        message: `Unable to copy SVG.`,
      }
    },
    clearClipboardMessage(data) {
      data.clipboardMessage = null
    },
  },
  asyncs: {
    async copySvgToClipboard(data, payload, result: SVGSVGElement) {
      const element = result
      const padding = 16

      // Get the SVG's bounding box
      const bbox = element.getBBox()
      const tViewBox = element.getAttribute('viewBox')
      const viewBox = [
        bbox.x - padding,
        bbox.y - padding,
        bbox.width + padding * 2,
        bbox.height + padding * 2,
      ].join(' ')

      // Save the original size
      const tW = element.getAttribute('width')
      const tH = element.getAttribute('height')

      // Resize the element to the bounding box
      element.setAttribute('viewBox', viewBox)
      element.setAttribute('width', String(bbox.width))
      element.setAttribute('height', String(bbox.height))

      // Take a snapshot of the element
      const s = new XMLSerializer()
      const svgString = s.serializeToString(element)

      // Reset the element to its original viewBox / size
      element.setAttribute('viewBox', tViewBox)
      element.setAttribute('width', tW)
      element.setAttribute('height', tH)

      // Copy to clipboard!
      try {
        navigator.clipboard.writeText(svgString)
      } catch (e) {
        copyToClipboard(svgString)
      }
    },
  },
})

export const useSelector = createSelectorHook(state)

export default state

// state.onUpdate(d => console.log(d.log[0]))
