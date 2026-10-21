import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import * as api from '../../api'
import { Async, Card, Empty, ErrorText, Field, PageTitle, TournamentBadge, btn, inputCls } from '../../components/ui'
import { TOURNAMENT_STATUSES, TOURNAMENT_STATUS_LABEL, formatDate } from '../../labels'
import type { Tournament } from '../../types'
import { act, useAsync } from '../../useAsync'

const EMPTY: api.TournamentInput = { title: '', description: '', location: '', eventDate: '', applyStartAt: '', applyEndAt: '' }

function TournamentForm({ initial, onSave, onCancel }: { initial: api.TournamentInput; onSave: (v: api.TournamentInput) => Promise<unknown>; onCancel: () => void }) {
  const [form, setForm] = useState(initial)
  const [error, setError] = useState('')
  const set = (key: keyof api.TournamentInput) => (e: { target: { value: string } }) => setForm({ ...form, [key]: e.target.value })

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    try {
      await onSave(form)
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <Field label="대회명"><input required value={form.title} onChange={set('title')} className={inputCls} /></Field>
      <Field label="설명"><textarea rows={3} value={form.description} onChange={set('description')} className={inputCls} /></Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="장소"><input required value={form.location} onChange={set('location')} className={inputCls} /></Field>
        <Field label="대회일"><input type="date" required value={form.eventDate} onChange={set('eventDate')} className={inputCls} /></Field>
        <Field label="접수 시작일"><input type="date" required value={form.applyStartAt} onChange={set('applyStartAt')} className={inputCls} /></Field>
        <Field label="접수 마감일"><input type="date" required value={form.applyEndAt} onChange={set('applyEndAt')} className={inputCls} /></Field>
      </div>
      <ErrorText>{error}</ErrorText>
      <div className="flex gap-2">
        <button className={btn.primary}>저장</button>
        <button type="button" onClick={onCancel} className={btn.secondary}>취소</button>
      </div>
    </form>
  )
}

const toInput = (t: Tournament): api.TournamentInput => ({
  title: t.title,
  description: t.description,
  location: t.location,
  eventDate: formatDate(t.eventDate),
  applyStartAt: formatDate(t.applyStartAt),
  applyEndAt: formatDate(t.applyEndAt),
})

export default function AdminTournaments() {
  const tournaments = useAsync(api.getTournaments, [])
  const [editing, setEditing] = useState<string | null>(null) // 'new' 또는 대회 id

  const onAdvance = (t: Tournament) => {
    const next = TOURNAMENT_STATUSES[TOURNAMENT_STATUSES.indexOf(t.status) + 1]
    if (confirm(`'${t.title}'을(를) '${TOURNAMENT_STATUS_LABEL[next]}' 상태로 바꿀까요?`)) act(() => api.advanceTournamentStatus(t.id), tournaments.reload)
  }
  const onDelete = (t: Tournament) => {
    if (confirm(`'${t.title}'을(를) 삭제할까요? 신청·대진표도 함께 삭제됩니다.`)) act(() => api.deleteTournament(t.id), tournaments.reload)
  }
  const done = () => {
    setEditing(null)
    tournaments.reload()
  }

  return (
    <>
      <PageTitle action={editing !== 'new' && <button onClick={() => setEditing('new')} className={btn.primary}>대회 추가</button>}>대회 관리</PageTitle>
      {editing === 'new' && (
        <Card className="mb-6">
          <h2 className="mb-3 font-semibold">새 대회</h2>
          <TournamentForm initial={EMPTY} onSave={async (v) => { await api.createTournament(v); done() }} onCancel={() => setEditing(null)} />
        </Card>
      )}
      <Async state={tournaments}>
        {(list) =>
          list.length === 0 ? (
            <Card><Empty>등록된 대회가 없습니다.</Empty></Card>
          ) : (
            <div className="space-y-3">
              {list.map((t) => {
                const next = TOURNAMENT_STATUSES[TOURNAMENT_STATUSES.indexOf(t.status) + 1]
                return (
                  <Card key={t.id}>
                    {editing === t.id ? (
                      <TournamentForm initial={toInput(t)} onSave={async (v) => { await api.updateTournament(t.id, v); done() }} onCancel={() => setEditing(null)} />
                    ) : (
                      <>
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <Link to={`/tournaments/${t.id}`} className="font-semibold hover:text-brand">{t.title}</Link>
                            <p className="text-sm text-slate-500">
                              대회일 {formatDate(t.eventDate)} · 접수 {formatDate(t.applyStartAt)} ~ {formatDate(t.applyEndAt)}
                            </p>
                          </div>
                          <TournamentBadge status={t.status} />
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <Link to={`/admin/tournaments/${t.id}/applications`} className={btn.small}>참가 신청 관리</Link>
                          <Link to={`/admin/tournaments/${t.id}/bracket`} className={btn.small}>대진표 관리</Link>
                          <button onClick={() => setEditing(t.id)} className={btn.small}>수정</button>
                          {next && (
                            <button onClick={() => onAdvance(t)} className={btn.small}>
                              → {TOURNAMENT_STATUS_LABEL[next]}
                            </button>
                          )}
                          <button onClick={() => onDelete(t)} className={btn.danger}>삭제</button>
                        </div>
                      </>
                    )}
                  </Card>
                )
              })}
            </div>
          )
        }
      </Async>
    </>
  )
}
