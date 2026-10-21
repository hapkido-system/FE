import { Link } from 'react-router'
import * as api from '../../api'
import { Async, PageTitle } from '../../components/ui'
import { useAsync } from '../../useAsync'

export default function AdminHome() {
  const summary = useAsync(api.getAdminSummary, [])
  const tile = 'block rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-brand/40 hover:shadow'
  return (
    <>
      <PageTitle>어드민 홈</PageTitle>
      <Async state={summary}>
        {(s) => (
          <div className="grid gap-4 sm:grid-cols-2">
            <Link to="/admin/masters" className={tile}>
              <p className="text-sm text-slate-500">관장 가입 승인 대기</p>
              <p className="mt-1 text-3xl font-bold text-brand">{s.pendingMasters}<span className="ml-1 text-base font-medium">건</span></p>
            </Link>
            <Link to="/admin/tournaments" className={tile}>
              <p className="text-sm text-slate-500">참가 신청 승인 대기</p>
              <p className="mt-1 text-3xl font-bold text-brand">{s.pendingApplications}<span className="ml-1 text-base font-medium">건</span></p>
            </Link>
          </div>
        )}
      </Async>
    </>
  )
}
