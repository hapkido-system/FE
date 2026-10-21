import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import * as api from '../api'
import { Card, ErrorText, Field, btn, inputCls } from '../components/ui'
import { USER_STATUS_LABEL } from '../labels'
import { useAuth } from '../store/auth'

type DevAccount = Awaited<ReturnType<typeof api.getDevAccounts>>[number]

export default function Login() {
  const login = useAuth((s) => s.login)
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [devAccounts, setDevAccounts] = useState<DevAccount[]>([])

  useEffect(() => {
    // shortcut: mock 단계라 배포 환경에도 계정 목록 노출, 실제 인증 연결 시 제거
    api.getDevAccounts().then(setDevAccounts)
  }, [])

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const me = await login(email)
      // 내부 경로만 허용 (외부 주소로의 리다이렉트 방지)
      const redirect = params.get('redirect')
      const safe = redirect?.startsWith('/') && !redirect.startsWith('//') ? redirect : null
      navigate(safe ?? (me.user.role === 'ADMIN' ? '/admin' : '/my'), { replace: true })
    } catch (err) {
      setError((err as Error).message)
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <Card>
        <h1 className="mb-6 text-xl font-bold">로그인</h1>
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="이메일">
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} autoComplete="email" />
          </Field>
          <Field label="비밀번호">
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} autoComplete="current-password" />
          </Field>
          <ErrorText>{error}</ErrorText>
          <button disabled={busy} className={`${btn.primary} w-full`}>로그인</button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-500">
          관장님이신가요? <Link to="/signup" className="font-medium text-brand underline">회원가입</Link>
        </p>
      </Card>

      {devAccounts.length > 0 && (
        <Card className="mt-4 border-dashed">
          <p className="mb-2 text-xs font-semibold text-slate-500">테스트용 mock 계정 (비밀번호 아무거나)</p>
          <ul className="space-y-1 text-sm">
            {devAccounts.map((a) => (
              <li key={a.email}>
                <button type="button" onClick={() => setEmail(a.email)} className="text-left hover:text-brand">
                  <span className="font-mono">{a.email}</span>
                  <span className="ml-2 text-slate-400">
                    {a.name} · {a.role === 'ADMIN' ? '관리자' : `관장(${USER_STATUS_LABEL[a.status]})`}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  )
}
