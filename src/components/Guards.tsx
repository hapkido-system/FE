import { Link, Navigate, Outlet, useLocation } from 'react-router'
import { USER_STATUS_LABEL } from '../labels'
import { useAuth } from '../store/auth'
import { Card, btn } from './ui'

function MasterStatusNotice() {
  const user = useAuth((s) => s.me!.user)
  return (
    <Card className="mx-auto max-w-lg text-center">
      <p className="mb-2 text-sm text-slate-500">가입 상태: {USER_STATUS_LABEL[user.status]}</p>
      {user.status === 'PENDING' ? (
        <>
          <h1 className="mb-2 text-xl font-bold">가입 승인 대기 중입니다</h1>
          <p className="text-sm text-slate-600">협회 관리자가 가입을 승인하면 도장 관리와 대회 신청을 이용할 수 있습니다.</p>
        </>
      ) : (
        <>
          <h1 className="mb-2 text-xl font-bold">가입이 반려되었습니다</h1>
          <p className="text-sm text-slate-600">자세한 내용은 협회로 문의해 주세요.</p>
        </>
      )}
      <Link to="/" className={`${btn.secondary} mt-6`}>메인으로</Link>
    </Card>
  )
}

// 비로그인 → 로그인(돌아올 경로 포함), 다른 역할 → 메인, 미승인 관장 → 상태 안내
export function RequireRole({ role }: { role: 'MASTER' | 'ADMIN' }) {
  const me = useAuth((s) => s.me)
  const location = useLocation()
  if (!me) return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`} replace />
  if (me.user.role !== role) return <Navigate to="/" replace />
  if (role === 'MASTER' && me.user.status !== 'APPROVED') return <MasterStatusNotice />
  return <Outlet />
}
