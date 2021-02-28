import { createState, createSelectorHook } from '@state-designer/react'
import { getPointer } from './hooks/useEvents'
import { Mark, CompleteMark, ClipboardMessage } from './types'
import pathAlgorithm, { StrokeOptions } from 'perfect-freehand'

const defaultOptions: StrokeOptions = {
  simulatePressure: true,
  pressure: true,
  streamline: 0.5,
  minSize: 2.5,
  maxSize: 8,
  smooth: 8,
  clip: true,
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
    restore: [] as { clear?: boolean; marks: CompleteMark[] }[],
    redos: [] as { clear?: boolean; marks: CompleteMark[] }[],
    marks: [] as CompleteMark[],
    currentMark: null as Mark | null,
    clipboardMessage: null as ClipboardMessage | null,
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
            LOADED: ['setup', 'setDarkMode'],
            UNLOADED: 'cleanup',
            RESIZED: ['resize'],
            PRESSED_KEY_Z: [
              { if: ['metaPressed', 'shiftPressed'], do: 'redoMark' },
              { if: 'metaPressed', unless: 'shiftPressed', do: 'undoMark' },
            ],
            PRESSED_KEY_D: 'toggledTrace',
            PRESSED_KEY_E: ['clearMarks'],
            CLEARED_CANVAS: ['clearMarks'],
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
              do: 'alertCouldNotCopyToClipboard',
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
          onEnter: [],
          on: {
            DOWNED_POINTER: {
              to: 'down',
              do: ['beginMark'],
            },
          },
        },
        down: {
          on: {
            LIFTED_POINTER: {
              do: ['completeMark'],
              to: 'up',
            },
            MOVED_POINTER: {
              do: ['addPointToMark'],
            },
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
        path: pathAlgorithm(mark.points, alg),
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
      const { x, y, p, type } = getPointer()
      data.settings.penMode = type === 'pen'

      data.redos = []

      data.currentMark = {
        type,
        points: [
          {
            x,
            y,
            angle: 0,
            pressure: p,
            distance: 0,
          },
        ],
        path: '',
      }
    },
    addPointToMark(data) {
      const { x, y, p, type } = getPointer()
      const { currentMark, alg } = data

      if (type !== currentMark!.type) return

      currentMark!.points.push({
        x: Math.round(x),
        y: Math.round(y),
        angle: 0,
        pressure: p,
        distance: 0,
      })

      currentMark!.path = pathAlgorithm(currentMark!.points, {
        ...alg,
        simulatePressure: alg.simulatePressure && currentMark.type !== 'pen',
      })
    },
    completeMark(data) {
      const { currentMark, alg } = data

      data.marks.push({
        ...currentMark!,
        path: pathAlgorithm(currentMark!.points, {
          ...alg,
          simulatePressure: alg.simulatePressure && currentMark.type !== 'pen',
        }),
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
        path: pathAlgorithm(mark.points, {
          ...alg,
          simulatePressure: alg.simulatePressure && mark.type !== 'pen',
        }),
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
        mark.path = pathAlgorithm(mark.points, {
          ...alg,
          simulatePressure: alg.simulatePressure && mark.type !== 'pen',
        })
      }

      if (currentMark) {
        currentMark.path = pathAlgorithm(currentMark.points, {
          ...alg,
          simulatePressure: alg.simulatePressure && currentMark.type !== 'pen',
        })
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
      return navigator.clipboard.writeText(svgString)
    },
  },
})

state.onUpdate(d => {
  if (d.isIn('up')) {
    localStorage.setItem(
      'pressure_lines',
      JSON.stringify({
        alg: d.data.alg,
        marks: d.data.marks,
        settings: d.data.settings,
      })
    )
  }
})

export const useSelector = createSelectorHook(state)

export default state
