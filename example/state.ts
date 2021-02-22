import { createState, createSelectorHook } from '@state-designer/react'
import { getPointer } from './hooks/useEvents'
import { Mark, CompleteMark } from './types'
import getPath, { getPathGenerator, StrokeOptions } from 'perfect-freehand'

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

let generator: ReturnType<typeof getPathGenerator>

const state = createState({
  data: {
    settings: { ...defaultSettings },
    alg: { ...defaultOptions },
    restore: [] as { clear?: boolean; marks: CompleteMark[] }[],
    redos: [] as { clear?: boolean; marks: CompleteMark[] }[],
    marks: [] as CompleteMark[],
    currentMark: null as Mark | null,
  },
  on: {
    RESET_OPTIONS: [d => (d.alg = { ...defaultOptions }), 'updatePaths'],
    CHANGED_OPTIONS: [(d, p) => (d.alg = { ...d.alg, ...p }), 'updatePaths'],
    CHANGED_SETTINGS: [(d, p) => (d.settings = { ...d.settings, ...p }), ,],
    TOGGLED_CONTROLS: d => (d.settings.showControls = !d.settings.showControls),
    LOADED: ['setup', 'setDarkMode'],
    UNLOADED: 'cleanup',
    RESIZED: ['resize'],
    PRESSED_KEY_Z: [
      { if: ['metaPressed', 'shiftPressed'], do: 'redoMark' },
      { if: 'metaPressed', unless: 'shiftPressed', do: 'undoMark' },
    ],
    PRESSED_KEY_D: [
      (d, p) =>
        (d.settings = { ...d.settings, showTrace: !d.settings.showTrace }),
    ],
    PRESSED_KEY_E: ['clearMarks'],
    CLEARED_CANVAS: ['clearMarks'],
    UNDO: ['undoMark'],
    REDO: ['redoMark'],
    TOGGLED_DARK_MODE: ['toggleDarkMode', 'setDarkMode'],
  },
  states: {
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
  conditions: {
    shiftPressed(data, payload) {
      return payload.keys.shift
    },
    metaPressed(data, payload) {
      return payload.keys.meta
    },
  },
  actions: {
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
        path: getPathGenerator(mark.points, {
          ...data.alg,
          simulatePressure: alg.simulatePressure && mark.type !== 'pen',
        }).path,
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

      generator = getPathGenerator([], { ...data.alg })
      const { path } = generator.addPoint([x, y, p])

      data.redos = []

      data.currentMark = {
        type,
        points: [[x, y, p]],
        path,
      }
    },
    addPointToMark(data) {
      const { x, y, p, type } = getPointer()
      const { alg } = data
      const currentMark = data.currentMark!

      if (type !== currentMark.type) return

      // {
      //   let ppp = ''
      //   let t = Date.now()

      //   let pts = [...currentMark.points]
      //   for (let i = 0; i < 100; i++) {
      //     pts.push([Math.round(x + i), Math.round(y + i), p])
      //     ppp = getPath(pts)
      //   }
      //   console.log('Get path point approach', Date.now() - t, ppp.length)
      // }
      // {
      //   let ppp = ''
      //   let t = Date.now()
      //   for (let i = 0; i < 100; i++) {
      //     ppp = generator.addPoint([Math.round(x + i), Math.round(y + i), p])
      //       .path
      //   }
      //   console.log('Add point approach', Date.now() - t, ppp.length)
      // }

      const { path } = generator.addPoint([Math.round(x), Math.round(y), p])
      currentMark.path = path
      currentMark.points.push([x, y, p])
    },
    completeMark(data) {
      const { currentMark, alg } = data

      data.marks.push({
        ...currentMark!,
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
        path: getPathGenerator(mark.points, {
          ...alg,
          simulatePressure: alg.simulatePressure && mark.type !== 'pen',
        }).path,
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
        mark.path = getPathGenerator(mark.points, {
          ...alg,
          simulatePressure: alg.simulatePressure && mark.type !== 'pen',
        }).path
      }

      if (currentMark) {
        currentMark.path = getPathGenerator(currentMark.points, {
          ...alg,
          simulatePressure: alg.simulatePressure && currentMark.type !== 'pen',
        }).path
      }
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
