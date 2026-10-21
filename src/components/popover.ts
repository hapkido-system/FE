import { useEffect, type CSSProperties, type RefObject } from 'react'

// 표처럼 overflow가 있는 컨테이너 안에서도 잘리지 않도록 화면 기준(fixed)으로 배치
// 아래 공간이 부족하고 위가 더 넓으면 위로 펼침
export function popupStyle(anchor: DOMRect, height: number, width = anchor.width): CSSProperties {
  const below = window.innerHeight - anchor.bottom
  const up = below < height + 16 && anchor.top > below
  const left = Math.max(8, Math.min(anchor.left, window.innerWidth - width - 8))
  return {
    position: 'fixed',
    left,
    width,
    ...(up ? { bottom: window.innerHeight - anchor.top + 4 } : { top: anchor.bottom + 4 }),
  }
}

// 바깥 클릭, 페이지 스크롤, 창 크기 변경 시 닫기 (fixed 위치가 어긋나므로). 팝업 안 스크롤은 제외
export function useDismiss(open: boolean, dismiss: () => void, root: RefObject<HTMLElement | null>, popup: RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) dismiss()
    }
    const onScroll = (e: Event) => {
      if (!popup.current?.contains(e.target as Node)) dismiss()
    }
    document.addEventListener('mousedown', onDown)
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', dismiss)
    return () => {
      document.removeEventListener('mousedown', onDown)
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', dismiss)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])
}
