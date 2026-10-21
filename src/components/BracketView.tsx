import { DIVISION_LABEL } from '../labels'
import type { BracketDetail, Match, Ranking } from '../types'

function roundLabel(round: number, total: number) {
  if (round === total) return '결승'
  if (round === total - 1) return '준결승'
  return `${2 ** (total - round + 1)}강`
}

interface Props {
  detail: BracketDetail
  highlightDojangId?: string
  onPick?: (match: Match, winnerId: string) => void // 관리자 결과 입력
}

export function BracketView({ detail, highlightDojangId, onPick }: Props) {
  const { matches, players } = detail
  const total = Math.max(0, ...matches.map((m) => m.round))
  const rounds = Array.from({ length: total }, (_, i) => matches.filter((m) => m.round === i + 1))

  const slot = (m: Match, id: string | null) => {
    if (!id) return <div className="px-3 py-2 text-sm text-slate-400">미정</div>
    const p = players[id]
    const won = m.winnerId === id
    const lost = m.winnerId !== null && !won
    const ours = highlightDojangId && p?.dojangId === highlightDojangId
    const canPick = onPick && m.player1Id && m.player2Id
    const cls = `flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm ${
      won ? 'bg-brand font-semibold text-white' : lost ? 'text-slate-400' : 'text-slate-800'
    } ${canPick && !won ? 'hover:bg-slate-100' : ''}`
    const body = (
      <>
        <span className="min-w-0">
          <span className="block truncate">
            {ours && <span className="mr-1 inline-block h-2 w-2 rounded-full bg-accent" aria-label="우리 도장" />}
            {p?.name ?? '?'}
          </span>
          <span className={`block truncate text-xs ${won ? 'text-white/80' : 'text-slate-400'}`}>{p?.dojangName}</span>
        </span>
        {won && <span className="shrink-0 text-xs">승</span>}
      </>
    )
    return canPick ? (
      <button type="button" className={cls} onClick={() => onPick(m, id)} aria-label={`${p?.name ?? ''} 승자로 지정`}>{body}</button>
    ) : (
      <div className={cls}>{body}</div>
    )
  }

  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex min-w-max gap-6">
        {rounds.map((list, i) => (
          <div key={i} className="flex w-48 flex-col">
            <div className="mb-3 text-center text-xs font-semibold text-slate-500">{roundLabel(i + 1, total)}</div>
            <div className="flex flex-1 flex-col justify-around gap-4">
              {list.map((m) => (
                <div key={m.id} className="divide-y divide-slate-200 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                  {slot(m, m.player1Id)}
                  {slot(m, m.player2Id)}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function BracketList({ details, highlightDojangId, onPick }: { details: BracketDetail[] } & Omit<Props, 'detail'>) {
  if (details.length === 0) return <p className="py-6 text-center text-sm text-slate-500">대진표가 없습니다.</p>
  return (
    <div className="space-y-8">
      {details.map((d) => (
        <div key={d.bracket.id}>
          <h3 className="mb-3 font-bold text-slate-800">{DIVISION_LABEL[d.bracket.division]}</h3>
          <BracketView detail={d} highlightDojangId={highlightDojangId} onPick={onPick} />
        </div>
      ))}
    </div>
  )
}

export function RankingTable({ rankings, highlightDojangId }: { rankings: Ranking[]; highlightDojangId?: string }) {
  const cell = (label: string, p: Ranking['first']) => (
    <div className={`flex items-center gap-3 rounded-lg px-3 py-2 ${p && p.dojangId === highlightDojangId ? 'bg-accent/10' : 'bg-slate-50'}`}>
      <span className="w-8 shrink-0 text-sm font-bold text-brand">{label}</span>
      {p ? (
        <span className="text-sm">
          <span className="font-semibold">{p.name}</span> <span className="text-slate-500">· {p.dojangName}</span>
        </span>
      ) : (
        <span className="text-sm text-slate-400">미정</span>
      )}
    </div>
  )
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {rankings.map((r) => (
        <div key={r.division} className="rounded-xl border border-slate-200 p-4">
          <h3 className="mb-3 font-bold">{DIVISION_LABEL[r.division]}</h3>
          <div className="space-y-2">
            {cell('1위', r.first)}
            {cell('2위', r.second)}
          </div>
        </div>
      ))}
    </div>
  )
}
