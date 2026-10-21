import { NavLink, Outlet } from 'react-router'

export function SectionNav({ title, items }: { title: string; items: [string, string][] }) {
  return (
    <div className="grid gap-6 md:grid-cols-[200px_1fr]">
      <nav className="md:sticky md:top-24 md:self-start">
        <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-slate-400">{title}</p>
        <ul className="flex gap-1 overflow-x-auto pb-2 md:flex-col md:pb-0">
          {items.map(([to, label]) => (
            <li key={to} className="shrink-0">
              <NavLink
                to={to}
                end
                className={({ isActive }) =>
                  `block rounded-lg px-3 py-2 text-sm font-medium ${isActive ? 'bg-brand text-white' : 'text-slate-600 hover:bg-white'}`
                }
              >
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <div className="min-w-0">
        <Outlet />
      </div>
    </div>
  )
}

export const MY_NAV: [string, string][] = [
  ['/my', '도장 관리 홈'],
  ['/my/dojang', '도장 정보'],
  ['/my/students', '학생 관리'],
  ['/my/applications', '대회 신청 내역'],
  ['/my/results', '우리 도장 경기 결과'],
]

export const ADMIN_NAV: [string, string][] = [
  ['/admin', '어드민 홈'],
  ['/admin/masters', '관장 가입 승인'],
  ['/admin/dojangs', '도장·관장 관리'],
  ['/admin/tournaments', '대회 관리'],
  ['/admin/notices', '공지사항 관리'],
]
