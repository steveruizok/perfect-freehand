import { memo } from 'react'
import { Mark } from 'types'

function MarkPath({ mark }: { mark: Mark }) {
  return <path d={mark.path} />
}

export default memo(MarkPath)
