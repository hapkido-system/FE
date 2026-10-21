import { Link } from 'react-router'
import { MY_NAV } from '../../components/SectionNav'
import { PageTitle } from '../../components/ui'
import { useAuth } from '../../store/auth'

const DESC: Record<string, string> = {
  '/my/dojang': '도장명·주소·연락처 조회 및 수정',
  '/my/students': '학생 등록·수정·삭제',
  '/my/applications': '대회별 신청 선수와 승인 상태',
  '/my/results': '우리 도장 선수의 경기와 순위',
}

export default function MyHome() {
  const me = useAuth((s) => s.me)
  return (
    <>
      <PageTitle>{me?.dojang?.name ?? '도장 관리'}</PageTitle>
      <div className="grid gap-4 sm:grid-cols-2">
        {MY_NAV.slice(1).map(([to, label]) => (
          <Link key={to} to={to} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-brand/40 hover:shadow">
            <h2 className="font-semibold text-slate-900">{label}</h2>
            <p className="mt-1 text-sm text-slate-500">{DESC[to]}</p>
          </Link>
        ))}
      </div>
    </>
  )
}
