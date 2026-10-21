import { useEffect, useId, useRef, useState } from 'react'
import { inputCls } from './ui'

type Mode = 'day' | 'month' | 'year'

interface Props {
  value: string // YYYY-MM-DD, 미선택이면 ''
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
  min?: string
  max?: string
  startMode?: Mode // 값이 없을 때 처음 보여줄 화면 (생년월일은 'year'가 편함)
  className?: string // 감싸는 div(너비 지정용)에 적용
  'aria-label'?: string
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']
const POPUP_HEIGHT = 340
const POPUP_WIDTH = 288 // w-72
const YEARS_PER_PAGE = 12

const pad = (n: number) => String(n).padStart(2, '0')
const toStr = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}` // m: 0~11
export const todayStr = () => {
  const t = new Date()
  return toStr(t.getFullYear(), t.getMonth(), t.getDate())
}

// 네이티브 date 입력은 달력 팝업을 꾸밀 수 없어 직접 구현
export function DatePicker({
  value,
  onChange,
  placeholder = '연도-월-일',
  required,
  min,
  max,
  startMode = 'day',
  className = '',
  'aria-label': ariaLabel,
}: Props) {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<Mode>('day')
  const [up, setUp] = useState(false)
  const [alignRight, setAlignRight] = useState(false)
  const [view, setView] = useState({ y: 0, m: 0 })
  const root = useRef<HTMLDivElement>(null)
  const button = useRef<HTMLButtonElement>(null)
  const popup = useRef<HTMLDivElement>(null)
  const id = useId()

  useEffect(() => {
    if (!open) return
    // 선택된 칸 → 오늘 → 첫 선택 가능 칸 순으로 포커스
    const q = (sel: string) => popup.current?.querySelector<HTMLButtonElement>(sel)
    ;(q('[aria-selected=true]') ?? q('[data-today]:not(:disabled)') ?? q('[data-cell]:not(:disabled)'))?.focus()
  }, [open, mode])

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  const show = () => {
    const rect = button.current!.getBoundingClientRect()
    const below = window.innerHeight - rect.bottom
    setUp(below < POPUP_HEIGHT + 16 && rect.top > below)
    setAlignRight(rect.left + POPUP_WIDTH > window.innerWidth - 16)
    const base = value || (max && max < todayStr() ? max : todayStr())
    setView({ y: Number(base.slice(0, 4)), m: Number(base.slice(5, 7)) - 1 })
    setMode(value ? 'day' : startMode)
    setOpen(true)
  }
  const close = () => {
    setOpen(false)
    button.current?.focus()
  }

  // 범위 검사: 해당 기간의 첫날~마지막날이 min/max와 겹치지 않으면 비활성
  const blocked = (from: string, to: string) => (!!min && to < min) || (!!max && from > max)
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate()
  const pageStart = Math.floor(view.y / YEARS_PER_PAGE) * YEARS_PER_PAGE

  // 모드별 이전/다음: 일=한 달, 월=한 해, 연=12년
  const nav = {
    day: {
      title: `${view.y}년 ${view.m + 1}월`,
      prev: () => setView(view.m === 0 ? { y: view.y - 1, m: 11 } : { ...view, m: view.m - 1 }),
      next: () => setView(view.m === 11 ? { y: view.y + 1, m: 0 } : { ...view, m: view.m + 1 }),
      prevOff: !!min && toStr(view.y, view.m, 1) <= min,
      nextOff: !!max && toStr(view.y, view.m, daysInMonth) >= max,
    },
    month: {
      title: `${view.y}년`,
      prev: () => setView({ ...view, y: view.y - 1 }),
      next: () => setView({ ...view, y: view.y + 1 }),
      prevOff: !!min && `${view.y}-01-01` <= min,
      nextOff: !!max && `${view.y}-12-31` >= max,
    },
    year: {
      title: `${pageStart} - ${pageStart + YEARS_PER_PAGE - 1}`,
      prev: () => setView({ ...view, y: view.y - YEARS_PER_PAGE }),
      next: () => setView({ ...view, y: view.y + YEARS_PER_PAGE }),
      prevOff: !!min && `${pageStart}-01-01` <= min,
      nextOff: !!max && `${pageStart + YEARS_PER_PAGE - 1}-12-31` >= max,
    },
  }[mode]

  const today = todayStr()
  const cellBase = 'flex items-center justify-center rounded-md text-sm'
  const cellState = (selected: boolean, disabled: boolean, isToday: boolean) =>
    selected
      ? 'bg-brand font-semibold text-white'
      : disabled
        ? 'text-slate-300'
        : `hover:bg-slate-100 ${isToday ? 'font-semibold text-brand ring-1 ring-brand/30' : 'text-slate-700'}`
  const navBtn = 'flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 disabled:text-slate-300 disabled:hover:bg-transparent'
  const chevron = (d: string) => (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
      <path fillRule="evenodd" d={d} clipRule="evenodd" />
    </svg>
  )

  const renderDays = () => {
    const firstWeekday = new Date(view.y, view.m, 1).getDay()
    const cells = [...Array<null>(firstWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]
    return (
      <>
        <div className="grid grid-cols-7 text-center text-xs font-medium text-slate-400">
          {WEEKDAYS.map((w, i) => (
            <div key={w} className={`py-1.5 ${i === 0 ? 'text-accent/70' : ''}`}>{w}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-y-1">
          {cells.map((day, i) => {
            if (day === null) return <div key={`e${i}`} />
            const s = toStr(view.y, view.m, day)
            const disabled = blocked(s, s)
            return (
              <button
                key={s}
                type="button"
                data-cell
                data-today={s === today || undefined}
                aria-selected={s === value}
                aria-label={s}
                disabled={disabled}
                onClick={() => {
                  onChange(s)
                  close()
                }}
                className={`${cellBase} mx-auto h-9 w-9 ${cellState(s === value, disabled, s === today)}`}
              >
                {day}
              </button>
            )
          })}
        </div>
      </>
    )
  }

  const renderGrid = (items: { key: number; label: string; from: string; to: string; selected: boolean; isToday: boolean; pick: () => void }[]) => (
    <div className="grid grid-cols-3 gap-2 pt-1">
      {items.map((it) => {
        const disabled = blocked(it.from, it.to)
        return (
          <button
            key={it.key}
            type="button"
            data-cell
            data-today={it.isToday || undefined}
            aria-selected={it.selected}
            disabled={disabled}
            onClick={it.pick}
            className={`${cellBase} h-11 ${cellState(it.selected, disabled, it.isToday)}`}
          >
            {it.label}
          </button>
        )
      })}
    </div>
  )

  const selY = value ? Number(value.slice(0, 4)) : null
  const selM = value ? Number(value.slice(5, 7)) - 1 : null
  const now = new Date()

  return (
    <div ref={root} className={`relative ${className}`}>
      <button
        ref={button}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={id}
        aria-label={ariaLabel && (value ? `${ariaLabel}: ${value}` : ariaLabel)}
        onClick={() => (open ? setOpen(false) : show())}
        // 아이콘 위·오른쪽·아래 여백이 같도록 Select와 같은 pr-2.5
        className={`${inputCls} flex cursor-default items-center justify-between gap-2 pr-2.5 text-left`}
      >
        <span className={`truncate ${value ? '' : 'text-slate-400'}`}>{value || placeholder}</span>
        <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" className={`h-4 w-4 shrink-0 cursor-pointer ${value ? 'text-slate-500' : 'text-slate-400'}`}>
          <path fillRule="evenodd" d="M5.75 2a.75.75 0 0 1 .75.75V4h7V2.75a.75.75 0 0 1 1.5 0V4h.25A2.75 2.75 0 0 1 18 6.75v8.5A2.75 2.75 0 0 1 15.25 18H4.75A2.75 2.75 0 0 1 2 15.25v-8.5A2.75 2.75 0 0 1 4.75 4H5V2.75A.75.75 0 0 1 5.75 2zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75z" clipRule="evenodd" />
        </svg>
      </button>

      {/* 폼 제출 시 필수 검증용 (화면에는 보이지 않음) */}
      {required && (
        <input tabIndex={-1} aria-hidden="true" required value={value} onChange={() => {}} className="pointer-events-none absolute inset-0 opacity-0" />
      )}

      {open && (
        <div
          ref={popup}
          id={id}
          role="dialog"
          aria-label="날짜 선택"
          // Field의 <label> 안에 있을 때 클릭이 트리거 버튼으로 다시 전달되지 않도록 기본 동작 차단
          onClick={(e) => e.preventDefault()}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.preventDefault()
              close()
            }
          }}
          className={`absolute z-20 w-72 rounded-lg border border-slate-200 bg-white p-3 shadow-lg ${up ? 'bottom-full mb-1' : 'top-full mt-1'} ${
            alignRight ? 'right-0' : 'left-0'
          }`}
        >
          <div className="mb-2 flex items-center justify-between gap-1">
            <button type="button" aria-label="이전" disabled={nav.prevOff} onClick={nav.prev} className={navBtn}>
              {chevron('M12.79 5.23a.75.75 0 0 1-.02 1.06L8.83 10l3.94 3.71a.75.75 0 1 1-1.04 1.08l-4.5-4.25a.75.75 0 0 1 0-1.08l4.5-4.25a.75.75 0 0 1 1.06.02z')}
            </button>
            {/* 제목을 누르면 일 → 월 → 연 순으로 더 넓은 단위 선택 화면으로 이동 */}
            <button
              type="button"
              disabled={mode === 'year'}
              onClick={() => setMode(mode === 'day' ? 'month' : 'year')}
              className="flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-semibold text-slate-800 hover:bg-slate-100 disabled:cursor-default disabled:hover:bg-transparent"
            >
              {nav.title}
              {mode !== 'year' && (
                <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-slate-400">
                  <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.06l3.71-3.83a.75.75 0 1 1 1.08 1.04l-4.25 4.39a.75.75 0 0 1-1.08 0L5.21 8.27a.75.75 0 0 1 .02-1.06z" clipRule="evenodd" />
                </svg>
              )}
            </button>
            <button type="button" aria-label="다음" disabled={nav.nextOff} onClick={nav.next} className={navBtn}>
              {chevron('M7.21 14.77a.75.75 0 0 1 .02-1.06L11.17 10 7.23 6.29a.75.75 0 1 1 1.04-1.08l4.5 4.25a.75.75 0 0 1 0 1.08l-4.5 4.25a.75.75 0 0 1-1.06-.02z')}
            </button>
          </div>

          {mode === 'day' && renderDays()}
          {mode === 'month' &&
            renderGrid(
              Array.from({ length: 12 }, (_, m) => ({
                key: m,
                label: `${m + 1}월`,
                from: toStr(view.y, m, 1),
                to: toStr(view.y, m, new Date(view.y, m + 1, 0).getDate()),
                selected: selY === view.y && selM === m,
                isToday: now.getFullYear() === view.y && now.getMonth() === m,
                pick: () => {
                  setView({ ...view, m })
                  setMode('day')
                },
              })),
            )}
          {mode === 'year' &&
            renderGrid(
              Array.from({ length: YEARS_PER_PAGE }, (_, i) => pageStart + i).map((y) => ({
                key: y,
                label: `${y}년`,
                from: `${y}-01-01`,
                to: `${y}-12-31`,
                selected: selY === y,
                isToday: now.getFullYear() === y,
                pick: () => {
                  setView({ ...view, y })
                  setMode('month')
                },
              })),
            )}
        </div>
      )}
    </div>
  )
}
