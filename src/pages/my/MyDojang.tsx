import { useState, type FormEvent } from 'react'
import * as api from '../../api'
import { Async, Card, ErrorText, Field, PageTitle, btn, inputCls } from '../../components/ui'
import { useAuth } from '../../store/auth'
import type { Dojang } from '../../types'
import { useAsync } from '../../useAsync'

function DojangForm({ dojang }: { dojang: Dojang }) {
  const reloadMe = useAuth((s) => s.load)
  const [form, setForm] = useState<api.DojangInput>({ name: dojang.name, address: dojang.address, phone: dojang.phone })
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setMsg('')
    setError('')
    try {
      await api.updateMyDojang(form)
      await reloadMe() // 헤더·홈의 도장명 갱신
      setMsg('저장했습니다.')
    } catch (err) {
      setError((err as Error).message)
    }
  }

  const fields: [keyof api.DojangInput, string][] = [['name', '도장명'], ['address', '주소'], ['phone', '연락처']]
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {fields.map(([key, label]) => (
        <Field key={key} label={label}>
          <input required value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} className={inputCls} />
        </Field>
      ))}
      <ErrorText>{error}</ErrorText>
      {msg && <p className="text-sm text-emerald-700">{msg}</p>}
      <button className={btn.primary}>저장</button>
    </form>
  )
}

export default function MyDojang() {
  const dojang = useAsync(api.getMyDojang, [])
  return (
    <>
      <PageTitle>도장 정보</PageTitle>
      <Card className="max-w-xl">
        <Async state={dojang}>{(d) => <DojangForm dojang={d} />}</Async>
      </Card>
    </>
  )
}
