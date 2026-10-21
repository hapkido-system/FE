import * as api from '../../api'
import { Async, Card, Empty, PageTitle, Table, btn, td } from '../../components/ui'
import { USER_STATUS_LABEL, formatDate } from '../../labels'
import type { UserStatus } from '../../types'
import { act, useAsync } from '../../useAsync'

const ORDER: UserStatus[] = ['PENDING', 'APPROVED', 'REJECTED']
const BADGE: Record<UserStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-800',
  APPROVED: 'bg-emerald-100 text-emerald-800',
  REJECTED: 'bg-red-100 text-red-700',
}

export default function AdminMasters() {
  const masters = useAsync(api.getMasters, [])

  return (
    <>
      <PageTitle>관장 가입 승인</PageTitle>
      <Card>
        <Async state={masters}>
          {(list) =>
            list.length === 0 ? (
              <Empty>가입 신청이 없습니다.</Empty>
            ) : (
              <Table head={['이름', '이메일', '연락처', '도장', '가입일', '상태', '']}>
                {[...list]
                  .sort((a, b) => ORDER.indexOf(a.user.status) - ORDER.indexOf(b.user.status))
                  .map(({ user, dojang }) => (
                    <tr key={user.id}>
                      <td className={`${td} font-medium`}>{user.name}</td>
                      <td className={td}>{user.email}</td>
                      <td className={td}>{user.phone}</td>
                      <td className={td}>{dojang?.name ?? '-'}</td>
                      <td className={td}>{formatDate(user.createdAt)}</td>
                      <td className={td}>
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${BADGE[user.status]}`}>{USER_STATUS_LABEL[user.status]}</span>
                      </td>
                      <td className={`${td} text-right`}>
                        <div className="flex justify-end gap-2">
                          {user.status !== 'APPROVED' && (
                            <button onClick={() => act(() => api.approveMaster(user.id), masters.reload)} className={btn.small}>승인</button>
                          )}
                          {user.status !== 'REJECTED' && (
                            <button
                              onClick={() => confirm(`${user.name} 관장의 가입을 반려할까요?`) && act(() => api.rejectMaster(user.id), masters.reload)}
                              className={btn.danger}
                            >
                              반려
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
              </Table>
            )
          }
        </Async>
      </Card>
    </>
  )
}
