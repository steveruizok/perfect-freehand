import { useEffect, useRef } from 'react'
export default function useSvgResizer() {
  const ref = useRef<SVGSVGElement>(null)

  useEffect(() => {
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

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', resize)
      return () => {
        window.removeEventListener('resize', resize)
      }
    }
  }, [])

  return ref
}
