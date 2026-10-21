import { useState } from 'react'
import { Link } from 'react-router'
import * as api from '../../api'
import { PlayerForm } from '../../components/PlayerForm'
import { AppStatusBadge, Async, Card, Empty, PageTitle, TournamentBadge, btn } from '../../components/ui'
import { DIVISION_LABEL, GENDER_LABEL, formatDate } from '../../labels'
import type { Application } from '../../types'
import { act, useAsync } from '../../useAsync'

export default function MyApplications() {
  const data = useAsync(() => Promise.all([api.getTournaments(), api.getMyApplications(), api.getMyStudents()]), [])
  const [editing, setEditing] = useState<string | null>(null)

  const onCancelApp = (a: Application) => {
    if (confirm(`${a.playerName} 선수의 신청을 취소할까요?`)) act(() => api.cancelApplication(a.id), data.reload)
  }

  return (
    <>
      <PageTitle>대회 신청 내역</PageTitle>
      <Async state={data}>
        {([tournaments, apps, students]) => {
          const groups = tournaments
            .map((t) => ({ t, apps: apps.filter((a) => a.tournamentId === t.id) }))
            .filter((g) => g.apps.length > 0)
          if (groups.length === 0) return <Card><Empty>신청 내역이 없습니다.</Empty></Card>
          return (
            <div className="space-y-6">
              {groups.map(({ t, apps }) => (
                <Card key={t.id}>
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <Link to={`/tournaments/${t.id}`} className="font-semibold hover:text-brand">{t.title}</Link>
                    <span className="flex items-center gap-2 text-sm text-slate-500">
                      {formatDate(t.eventDate)} <TournamentBadge status={t.status} />
                    </span>
                  </div>
                  <ul className="divide-y divide-slate-100">
                    {apps.map((a) => {
                      const editable = t.status === 'OPEN' && a.status === 'PENDING'
                      return (
                        <li key={a.id} className="py-3">
                          {editing === a.id ? (
                            <PlayerForm
                              students={students}
                              appliedStudentIds={new Set(apps.flatMap((x) => (x.studentId ? [x.studentId] : [])))}
                              initial={a}
                              submitLabel="수정 저장"
                              onSubmit={async (input) => {
                                await api.updateApplication(a.id, input)
                                setEditing(null)
                                await data.reload()
                              }}
                              onCancel={() => setEditing(null)}
                            />
                          ) : (
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div>
                                <span className="font-medium">{a.playerName}</span>
                                <span className="ml-2 text-sm text-slate-500">
                                  {GENDER_LABEL[a.gender]} · {DIVISION_LABEL[a.division]} · {a.studentId ? '학생 목록' : '직접 입력'}
                                </span>
                                {a.rejectReason && <p className="mt-1 text-sm text-red-600">반려 사유: {a.rejectReason}</p>}
                              </div>
                              <div className="flex items-center gap-2">
                                {editable && (
                                  <>
                                    <button onClick={() => setEditing(a.id)} className={btn.small}>수정</button>
                                    <button onClick={() => onCancelApp(a)} className={btn.danger}>취소</button>
                                  </>
                                )}
                                <AppStatusBadge status={a.status} />
                              </div>
                            </div>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                </Card>
              ))}
            </div>
          )
        }}
      </Async>
    </>
  )
}
