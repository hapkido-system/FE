import { Link, Outlet, useNavigate } from 'react-router'
import * as api from '../api'
import { useAuth } from '../store/auth'

function Header() {
  const me = useAuth((s) => s.me)
  const logout = useAuth((s) => s.logout)
  const navigate = useNavigate()
  const user = me?.user

  const onLogout = async () => {
    await logout()
    navigate('/')
  }

  const link = 'rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100'

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link to="/" className="flex min-w-0 items-center gap-3">
          <img src="/logo.jpg" alt="광진구합기도협회 로고" className="h-10 w-10 shrink-0 rounded-full" />
          <span className="truncate text-lg font-bold text-brand">광진구합기도협회</span>
        </Link>
        <nav className="flex shrink-0 items-center gap-1">
          {user ? (
            <>
              {user.role === 'ADMIN' && <Link to="/admin" className={link}>어드민</Link>}
              {user.role === 'MASTER' && <Link to="/my" className={link}>도장 관리</Link>}
              <span className="hidden px-2 text-sm text-slate-500 sm:inline">{user.name}님</span>
              <button onClick={onLogout} className={link}>로그아웃</button>
            </>
          ) : (
            <>
              <Link to="/login" className={link}>로그인</Link>
              <Link to="/signup" className="rounded-md bg-brand px-3 py-2 text-sm font-semibold text-white hover:bg-brand-dark">회원가입</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}

export default function Layout() {
  const onReset = async () => {
    if (!confirm('mock 데이터를 시드 상태로 되돌리고 로그아웃합니다.')) return
    await api.resetMockData()
    location.href = '/'
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <Outlet />
      </main>
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-5 text-xs text-slate-500">
          <span>© 광진구합기도협회 (GJHA)</span>
          {import.meta.env.DEV && (
            <button onClick={onReset} className="rounded border border-dashed border-slate-300 px-2 py-1 hover:bg-slate-50">
              개발용: mock 데이터 초기화
            </button>
          )}
        </div>
      </footer>
    </div>
  )
}
