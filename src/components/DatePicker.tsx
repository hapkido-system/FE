import { useEffect, useId, useRef, useState } from 'react'
import { Select } from './Select'
import { inputCls } from './ui'

interface Props {
  value: string // YYYY-MM-DD, 미선택이면 ''
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
  min?: string
  max?: string
  className?: string // 감싸는 div(너비 지정용)에 적용
  'aria-label'?: string
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']
const POPUP_HEIGHT = 340
const POPUP_WIDTH = 288 // w-72

const pad = (n: number) => String(n).padStart(2, '0')
const toStr = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}` // m: 0~11
export const todayStr = () => {
  const t = new Date()
  return toStr(t.getFullYear(), t.getMonth(), t.getDate())
}

// 네이티브 date 입력은 달력 팝업을 꾸밀 수 없어 직접 구현
export function DatePicker({ value, onChange, placeholder = '연도-월-일', required, min, max, className = '', 'aria-label': ariaLabel }: Props) {
  const [open, setOpen] = useState(false)
  const [up, setUp] = useState(false)
  const [alignRight, setAlignRight] = useState(false)
  const base = value || (max && max < todayStr() ? max : todayStr())
  const [view, setView] = useState({ y: Number(base.slice(0, 4)), m: Number(base.slice(5, 7)) - 1 })
  const root = useRef<HTMLDivElement>(null)
  const button = useRef<HTMLButtonElement>(null)
  const popup = useRef<HTMLDivElement>(null)
  const id = useId()

  useEffect(() => {
    if (!open) return
    // 선택된 날 → 오늘 → 첫 선택 가능 날 순으로 포커스
    const q = (sel: string) => popup.current?.querySelector<HTMLButtonElement>(sel)
    ;(q('[aria-selected=true]') ?? q('[data-today]:not(:disabled)') ?? q('[data-day]:not(:disabled)'))?.focus()
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
    const b = value || base
    setView({ y: Number(b.slice(0, 4)), m: Number(b.slice(5, 7)) - 1 })
    setOpen(true)
  }
  const close = () => {
    setOpen(false)
    button.current?.focus()
  }
  const moveMonth = (delta: number) => {
    const d = new Date(view.y, view.m + delta, 1)
    setView({ y: d.getFullYear(), m: d.getMonth() })
  }

  // 연도 선택 범위: min/max가 있으면 그 사이, 없으면 올해 기준 -100 ~ +5년
  const thisYear = new Date().getFullYear()
  const minYear = min ? Number(min.slice(0, 4)) : thisYear - 100
  const maxYear = max ? Number(max.slice(0, 4)) : thisYear + 5
  const years = Array.from({ length: maxYear - minYear + 1 }, (_, i) => maxYear - i)

  const firstWeekday = new Date(view.y, view.m, 1).getDay()
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate()
  const cells = [...Array<null>(firstWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]
  const today = todayStr()
  const outOfRange = (s: string) => (!!min && s < min) || (!!max && s > max)
  const prevDisabled = !!min && toStr(view.y, view.m, 1) <= min
  const nextDisabled = !!max && toStr(view.y, view.m, daysInMonth) >= max

  const navBtn = 'flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 disabled:text-slate-300 disabled:hover:bg-transparent'

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
            if (e.key === 'Escape' && !e.defaultPrevented) {
              e.preventDefault()
              close()
            }
          }}
          className={`absolute z-20 w-72 rounded-lg border border-slate-200 bg-white p-3 shadow-lg ${up ? 'bottom-full mb-1' : 'top-full mt-1'} ${
            alignRight ? 'right-0' : 'left-0'
          }`}
        >
          <div className="mb-2 flex items-center gap-1">
            <button type="button" aria-label="이전 달" disabled={prevDisabled} onClick={() => moveMonth(-1)} className={navBtn}>
              <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 0 1-.02 1.06L8.83 10l3.94 3.71a.75.75 0 1 1-1.04 1.08l-4.5-4.25a.75.75 0 0 1 0-1.08l4.5-4.25a.75.75 0 0 1 1.06.02z" clipRule="evenodd" />
              </svg>
            </button>
            <Select
              aria-label="연도"
              value={String(view.y)}
              onChange={(v) => setView({ ...view, y: Number(v) })}
              options={years.map((y) => ({ value: String(y), label: `${y}년` }))}
              className="flex-1"
            />
            <Select
              aria-label="월"
              value={String(view.m)}
              onChange={(v) => setView({ ...view, m: Number(v) })}
              options={Array.from({ length: 12 }, (_, i) => ({ value: String(i), label: `${i + 1}월` }))}
              className="w-[5.5rem]"
            />
            <button type="button" aria-label="다음 달" disabled={nextDisabled} onClick={() => moveMonth(1)} className={navBtn}>
              <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 0 1 .02-1.06L11.17 10 7.23 6.29a.75.75 0 1 1 1.04-1.08l4.5 4.25a.75.75 0 0 1 0 1.08l-4.5 4.25a.75.75 0 0 1-1.06-.02z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-7 text-center text-xs font-medium text-slate-400">
            {WEEKDAYS.map((w, i) => (
              <div key={w} className={`py-1.5 ${i === 0 ? 'text-accent/70' : ''}`}>{w}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-y-1 text-center text-sm">
            {cells.map((day, i) => {
              if (day === null) return <div key={`e${i}`} />
              const s = toStr(view.y, view.m, day)
              const selected = s === value
              const disabled = outOfRange(s)
              return (
                <button
                  key={s}
                  type="button"
                  data-day
                  data-today={s === today || undefined}
                  aria-selected={selected}
                  aria-label={s}
                  disabled={disabled}
                  onClick={() => {
                    onChange(s)
                    close()
                  }}
                  className={`mx-auto flex h-9 w-9 items-center justify-center rounded-md ${
                    selected
                      ? 'bg-brand font-semibold text-white'
                      : disabled
                        ? 'text-slate-300'
                        : `hover:bg-slate-100 ${s === today ? 'font-semibold text-brand ring-1 ring-brand/30' : 'text-slate-700'}`
                  }`}
                >
                  {day}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
