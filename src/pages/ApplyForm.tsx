import { useState } from 'react'
import { Link, useParams } from 'react-router'
import * as api from '../api'
import { PlayerForm } from '../components/PlayerForm'
import { AppStatusBadge, Async, Card, Empty, PageTitle } from '../components/ui'
import { DIVISION_LABEL, GENDER_LABEL } from '../labels'
import { useAsync } from '../useAsync'

export default function ApplyForm() {
  const { id = '' } = useParams()
  const data = useAsync(
    () => Promise.all([api.getTournament(id), api.getMyStudents(), api.getMyApplications(id)]),
    [id],
  )
  const [done, setDone] = useState('')

  return (
    <div className="mx-auto max-w-2xl">
      <Link to={`/tournaments/${id}`} className="mb-4 inline-block text-sm text-slate-500 hover:text-brand">← 대회 상세로</Link>
      <Async state={data}>
        {([tournament, students, apps]) => (
          <>
            <PageTitle>참가 신청</PageTitle>
            <p className="-mt-4 mb-6 text-slate-600">{tournament.title}</p>
            {tournament.status !== 'OPEN' ? (
              <Card>
                <p className="text-slate-600">접수중인 대회만 신청할 수 있습니다.</p>
              </Card>
            ) : (
              <div className="space-y-6">
                <Card>
                  <PlayerForm
                    students={students}
                    appliedStudentIds={new Set(apps.flatMap((a) => (a.studentId ? [a.studentId] : [])))}
                    submitLabel="신청 제출"
                    onSubmit={async (input) => {
                      const app = await api.createApplication(id, input)
                      setDone(`${app.playerName} 선수를 신청했습니다. 관리자 승인을 기다려 주세요.`)
                      await data.reload()
                    }}
                  />
                  {done && <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{done}</p>}
                </Card>
                <Card>
                  <h2 className="mb-2 font-semibold">이 대회 신청 내역</h2>
                  {apps.length === 0 ? (
                    <Empty>아직 신청한 선수가 없습니다.</Empty>
                  ) : (
                    <ul className="divide-y divide-slate-100">
                      {apps.map((a) => (
                        <li key={a.id} className="flex items-center justify-between gap-2 py-2.5 text-sm">
                          <span>
                            <b>{a.playerName}</b> <span className="text-slate-500">{GENDER_LABEL[a.gender]} · {DIVISION_LABEL[a.division]}</span>
                          </span>
                          <AppStatusBadge status={a.status} />
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>
              </div>
            )}
          </>
        )}
      </Async>
    </div>
  )
}
