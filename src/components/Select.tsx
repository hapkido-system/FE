import { useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react'
import { popupStyle, useDismiss } from './popover'
import { inputCls } from './ui'

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

interface Props {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  required?: boolean
  className?: string // 감싸는 div(너비 지정용)에 적용
  'aria-label'?: string
}

const LIST_MAX_HEIGHT = 240 // max-h-60

// 네이티브 select는 펼친 목록을 꾸밀 수 없어 listbox로 직접 구현
export function Select({ value, onChange, options, placeholder = '선택하세요', required, className = '', 'aria-label': ariaLabel }: Props) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const [pos, setPos] = useState<CSSProperties>({})
  const root = useRef<HTMLDivElement>(null)
  const button = useRef<HTMLButtonElement>(null)
  const list = useRef<HTMLUListElement>(null)
  const id = useId()
  const selected = options.find((o) => o.value === value)

  useDismiss(open, () => setOpen(false), root, list)

  useEffect(() => {
    if (open) list.current?.focus()
  }, [open])

  useEffect(() => {
    if (open) list.current?.children[active]?.scrollIntoView({ block: 'nearest' })
  }, [open, active])

  const show = () => {
    setPos(popupStyle(button.current!.getBoundingClientRect(), LIST_MAX_HEIGHT))
    setActive(options.findIndex((o) => o.value === value))
    setOpen(true)
  }
  const close = () => {
    setOpen(false)
    button.current?.focus()
  }
  const pick = (o: SelectOption) => {
    if (o.disabled) return
    onChange(o.value)
    close()
  }
  const move = (dir: 1 | -1) => {
    let i = active
    for (let n = 0; n < options.length; n++) {
      i = (i + dir + options.length) % options.length
      if (!options[i].disabled) return setActive(i)
    }
  }

  const onListKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      move(e.key === 'ArrowDown' ? 1 : -1)
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      if (options[active]) pick(options[active])
    } else if (e.key === 'Escape') {
      e.preventDefault()
      close()
    } else if (e.key === 'Tab') {
      setOpen(false)
    }
  }

  return (
    <div ref={root} className={`relative ${className}`}>
      <button
        ref={button}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={id}
        aria-label={ariaLabel && (selected ? `${ariaLabel}: ${selected.label}` : ariaLabel)}
        onClick={() => (open ? setOpen(false) : show())}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault()
            show()
          }
        }}
        // 화살표 위·오른쪽·아래 여백이 모두 10px이 되도록 pr-2.5 (높이 36px - 아이콘 16px) / 2
        className={`${inputCls} flex cursor-default items-center justify-between gap-2 pr-2.5 text-left`}
      >
        <span className={`truncate ${selected ? '' : 'text-slate-400'}`}>{selected?.label ?? placeholder}</span>
        <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}>
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.06l3.71-3.83a.75.75 0 1 1 1.08 1.04l-4.25 4.39a.75.75 0 0 1-1.08 0L5.21 8.27a.75.75 0 0 1 .02-1.06z" clipRule="evenodd" />
        </svg>
      </button>

      {/* 폼 제출 시 필수 검증용 (화면에는 보이지 않음) */}
      {required && (
        <input tabIndex={-1} aria-hidden="true" required value={value} onChange={() => {}} className="pointer-events-none absolute inset-0 opacity-0" />
      )}

      {open && (
        <ul
          ref={list}
          id={id}
          role="listbox"
          tabIndex={-1}
          aria-activedescendant={active >= 0 ? `${id}-${active}` : undefined}
          onKeyDown={onListKey}
          style={pos}
          className="z-50 max-h-60 overflow-y-auto overscroll-contain rounded-lg border border-slate-200 bg-white p-1 shadow-lg outline-none"
        >
          {options.length === 0 && <li className="px-3 py-2 text-sm text-slate-400">선택할 항목이 없습니다</li>}
          {options.map((o, i) => {
            const isSelected = o.value === value
            return (
              <li
                key={o.value}
                id={`${id}-${i}`}
                role="option"
                aria-selected={isSelected}
                aria-disabled={o.disabled}
                onMouseEnter={() => !o.disabled && setActive(i)}
                // Field의 <label> 안에 있을 때 클릭이 버튼으로 다시 전달되지 않도록 기본 동작 차단
                onClick={(e) => {
                  e.preventDefault()
                  pick(o)
                }}
                className={`flex items-center justify-between gap-3 rounded-md px-3 py-2 text-sm ${
                  o.disabled ? 'cursor-not-allowed text-slate-300' : i === active ? 'bg-slate-100' : ''
                } ${isSelected ? 'font-semibold text-brand' : ''}`}
              >
                <span>{o.label}</span>
                {isSelected && (
                  <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0">
                    <path fillRule="evenodd" d="M16.7 5.3a1 1 0 0 1 0 1.4l-8 8a1 1 0 0 1-1.4 0l-4-4a1 1 0 1 1 1.4-1.4L8 12.58l7.3-7.3a1 1 0 0 1 1.4 0z" clipRule="evenodd" />
                  </svg>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
