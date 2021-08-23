import * as React from 'react'
import merge from 'deepmerge'
import * as idb from 'idb-keyval'
import createReact, { UseStore } from 'zustand'
import createVanilla, { StoreApi } from 'zustand/vanilla'
import type { Patch, Command, Entries } from 'types'
import { deepMerge } from './merge'

/* -------------------------------------------------- */
/*                     Generic API                    */
/* -------------------------------------------------- */

export class StateManager<T extends object> {
  private _id: string

  private _current: T

  private _previous: T

  private _snapshot: Patch<T>

  private _pointer = -1

  private _stack: Command<T>[] = []

  private _store: StoreApi<T>

  private _context: React.Context<this>

  public useAppState: UseStore<T>

  constructor(initial: T, id = 'state', reset = false) {
    this._id = id
    this._current = initial
    this._store = createVanilla(() => this._current)
    this.useAppState = createReact(this._store)

    if (reset) {
      idb.del(id)
    }

    idb.get<T>(id).then((savedState) => {
      if (savedState) {
        this._current = savedState
        this._previous = savedState
        this._store.setState(savedState)
      }
    })

    this._context = React.createContext(this)
  }

  deepMerge = <R>(target: R, elm: R): R => {
    const result: R = { ...target }

    const entries = Object.entries(elm) as [keyof R, R[keyof R]][]

    entries.forEach(([key, value]) => {
      if (value === Object(value) && !Array.isArray(value)) {
        result[key] = this.deepMerge(result[key], value)
      } else {
        result[key] = value
      }
    })

    return result
  }

  private merge = (a: T, b: Patch<T>) => {
    const next = deepMerge<T>(a, b as any)
    return this.clean(next)
  }

  protected clean = (state: T) => {
    return state
  }

  public patchState = (patch: Patch<T>) => {
    this._current = this.merge(this._current, patch)
    this._store.setState(this._current)
    return this
  }

  public setSnapshot(patch: Patch<T>) {
    this._snapshot = patch
    return this
  }

  public setState = (patch: Command<T>) => {
    this._stack = [...this._stack.slice(0, this._pointer + 1), patch]
    this._pointer = this._stack.length - 1
    this._current = this.merge(this._current, patch.after)
    this._previous = this._current
    idb.set(this._id, this._current)
    this._store.setState(this._current)

    return this
  }

  public undo = () => {
    if (this._pointer < 0) return this
    const patch = this._stack[this._pointer]
    this._pointer -= 1
    this._current = this.clean(this.merge(this._current, patch.before))
    this._previous = this._current
    idb.set(this._id, this._current)
    this._store.setState(this._current)

    return this
  }

  public redo = () => {
    if (this._pointer >= this._stack.length - 1) return this
    this._pointer += 1
    const patch = this._stack[this._pointer]
    this._current = this.merge(this._current, patch.after)
    this._previous = this._current
    idb.set(this._id, this._current)
    this._store.setState(this._current)

    return this
  }

  get current() {
    return this._current
  }

  get previous() {
    return this._previous
  }

  get snapshot() {
    return this._snapshot
  }

  getState() {
    return this._current
  }

  get state() {
    return this.getState()
  }

  get context() {
    return this._context
  }

  getPrevState() {
    return this.previous
  }

  get prevState() {
    return this.getPrevState()
  }
}
