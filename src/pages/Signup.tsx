import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import type { SignupInput } from '../api'
import { Card, ErrorText, Field, btn, inputCls } from '../components/ui'
import { useAuth } from '../store/auth'

const FIELDS: { section: string; items: [keyof SignupInput, string, string][] }[] = [
  {
    section: '관장 정보',
    items: [
      ['name', '이름', 'text'],
      ['email', '이메일', 'email'],
      ['password', '비밀번호', 'password'],
      ['phone', '연락처', 'tel'],
    ],
  },
  {
    section: '도장 정보',
    items: [
      ['dojangName', '도장명', 'text'],
      ['dojangAddress', '주소', 'text'],
      ['dojangPhone', '연락처', 'tel'],
    ],
  },
]

export default function Signup() {
  const signup = useAuth((s) => s.signup)
  const navigate = useNavigate()
  const [form, setForm] = useState<SignupInput>({ name: '', email: '', password: '', phone: '', dojangName: '', dojangAddress: '', dojangPhone: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await signup(form)
      navigate('/my', { replace: true }) // 승인 대기 안내가 표시됨
    } catch (err) {
      setError((err as Error).message)
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <Card>
        <h1 className="text-xl font-bold">관장 회원가입</h1>
        <p className="mb-6 mt-1 text-sm text-slate-500">가입 후 협회 관리자의 승인을 받으면 이용할 수 있습니다.</p>
        <form onSubmit={onSubmit} className="space-y-6">
          {FIELDS.map(({ section, items }) => (
            <fieldset key={section} className="space-y-3">
              <legend className="mb-2 font-semibold text-slate-800">{section}</legend>
              {items.map(([key, label, type]) => (
                <Field key={key} label={label}>
                  <input
                    type={type}
                    required
                    value={form[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    className={inputCls}
                  />
                </Field>
              ))}
            </fieldset>
          ))}
          <ErrorText>{error}</ErrorText>
          <button disabled={busy} className={`${btn.primary} w-full`}>가입 신청</button>
        </form>
      </Card>
    </div>
  )
}
