import type { ReactNode } from 'react'
import { APPLICATION_STATUS_LABEL, TOURNAMENT_STATUS_LABEL } from '../labels'
import type { ApplicationStatus, TournamentStatus } from '../types'

export const btn = {
  primary: 'inline-flex items-center justify-center rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50',
  secondary: 'inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50',
  danger: 'inline-flex items-center justify-center rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50',
  small: 'inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50',
}

// 너비를 직접 지정할 때는 inputBase 사용 (w-full과 함께 쓰면 w-full이 우선됨)
export const inputBase =
  'rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20'
export const inputCls = `w-full ${inputBase}`

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      {children}
    </label>
  )
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>{children}</section>
}

export function PageTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-2xl font-bold text-slate-900">{children}</h1>
      {action}
    </div>
  )
}

export function ErrorText({ children }: { children: ReactNode }) {
  if (!children) return null
  return <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{children}</p>
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="py-8 text-center text-sm text-slate-500">{children}</p>
}

// useAsync 결과를 로딩·에러·데이터로 분기
export function Async<T>({ state, children }: { state: { data: T | null; error: string | null; loading: boolean }; children: (data: T) => ReactNode }) {
  if (state.error) return <ErrorText>{state.error}</ErrorText>
  if (state.data === null) return <p className="py-8 text-center text-sm text-slate-400">불러오는 중…</p>
  return <>{children(state.data)}</>
}

const TOURNAMENT_BADGE: Record<TournamentStatus, string> = {
  UPCOMING: 'bg-slate-100 text-slate-700',
  OPEN: 'bg-emerald-100 text-emerald-800',
  CLOSED: 'bg-amber-100 text-amber-800',
  BRACKET_PUBLISHED: 'bg-sky-100 text-sky-800',
  IN_PROGRESS: 'bg-red-100 text-red-700',
  FINISHED: 'bg-slate-200 text-slate-600',
}

export function TournamentBadge({ status }: { status: TournamentStatus }) {
  return <span className={`inline-block shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${TOURNAMENT_BADGE[status]}`}>{TOURNAMENT_STATUS_LABEL[status]}</span>
}

const APP_BADGE: Record<ApplicationStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-800',
  APPROVED: 'bg-emerald-100 text-emerald-800',
  REJECTED: 'bg-red-100 text-red-700',
}

export function AppStatusBadge({ status }: { status: ApplicationStatus }) {
  return <span className={`inline-block shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${APP_BADGE[status]}`}>{APPLICATION_STATUS_LABEL[status]}</span>
}

export function Table({ head, children }: { head: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-max text-left text-sm">
        <thead className="border-b border-slate-200 text-slate-500">
          <tr>{head.map((h) => <th key={h} className="px-3 py-2 font-medium">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-slate-100">{children}</tbody>
      </table>
    </div>
  )
}

export const td = 'px-3 py-2.5 align-middle'
