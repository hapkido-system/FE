import { Link, useParams } from 'react-router'
import * as api from '../../api'
import { AppStatusBadge, Async, Card, Empty, PageTitle, Table, TournamentBadge, btn, td } from '../../components/ui'
import { DIVISIONS, DIVISION_LABEL, GENDER_LABEL } from '../../labels'
import type { ApplicationWithDojang } from '../../types'
import { act, useAsync } from '../../useAsync'

export default function AdminApplications() {
  const { id = '' } = useParams()
  const data = useAsync(() => Promise.all([api.getTournament(id), api.getTournamentApplications(id)]), [id])

  const onReject = (a: ApplicationWithDojang) => {
    const reason = prompt(`${a.playerName} 선수 신청 반려 사유를 입력하세요.`)
    if (reason !== null) act(() => api.rejectApplication(a.id, reason), data.reload)
  }

  return (
    <>
      <Link to="/admin/tournaments" className="mb-4 inline-block text-sm text-slate-500 hover:text-brand">← 대회 관리</Link>
      <Async state={data}>
        {([t, apps]) => {
          const reviewable = t.status === 'OPEN'
          return (
            <>
              <PageTitle action={<TournamentBadge status={t.status} />}>참가 신청 관리</PageTitle>
              <p className="-mt-4 mb-6 text-slate-600">{t.title}</p>
              {!reviewable && <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">접수중인 대회만 승인·반려할 수 있습니다.</p>}
              <div className="space-y-6">
                {DIVISIONS.map((division) => {
                  const list = apps.filter((a) => a.division === division)
                  return (
                    <Card key={division}>
                      <h2 className="mb-2 font-semibold">
                        {DIVISION_LABEL[division]} <span className="text-sm font-normal text-slate-400">{list.length}명</span>
                      </h2>
                      {list.length === 0 ? (
                        <Empty>신청이 없습니다.</Empty>
                      ) : (
                        <Table head={['선수', '성별', '도장', '입력', '상태', '']}>
                          {list.map((a) => (
                            <tr key={a.id}>
                              <td className={`${td} font-medium`}>
                                {a.playerName}
                                {a.rejectReason && <p className="text-xs font-normal text-red-600">사유: {a.rejectReason}</p>}
                              </td>
                              <td className={td}>{GENDER_LABEL[a.gender]}</td>
                              <td className={td}>{a.dojangName}</td>
                              <td className={td}>{a.studentId ? '학생 목록' : '직접 입력'}</td>
                              <td className={td}><AppStatusBadge status={a.status} /></td>
                              <td className={`${td} text-right`}>
                                {reviewable && (
                                  <div className="flex justify-end gap-2">
                                    {a.status !== 'APPROVED' && (
                                      <button onClick={() => act(() => api.approveApplication(a.id), data.reload)} className={btn.small}>승인</button>
                                    )}
                                    {a.status !== 'REJECTED' && <button onClick={() => onReject(a)} className={btn.danger}>반려</button>}
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))}
                        </Table>
                      )}
                    </Card>
                  )
                })}
              </div>
            </>
          )
        }}
      </Async>
    </>
  )
}
