import { useState, type FormEvent } from 'react'
import * as api from '../../api'
import { Async, Card, Empty, ErrorText, Field, PageTitle, btn, inputCls } from '../../components/ui'
import { USER_STATUS_LABEL } from '../../labels'
import type { MasterWithDojang } from '../../types'
import { useAsync } from '../../useAsync'

function EditForm({ m, onDone }: { m: MasterWithDojang; onDone: () => void }) {
  const [form, setForm] = useState<api.MasterUpdateInput>({
    name: m.user.name,
    email: m.user.email,
    phone: m.user.phone,
    dojang: { name: m.dojang?.name ?? '', address: m.dojang?.address ?? '', phone: m.dojang?.phone ?? '' },
  })
  const [error, setError] = useState('')

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    try {
      await api.updateMaster(m.user.id, form)
      onDone()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  const user = (key: 'name' | 'email' | 'phone', label: string) => (
    <Field label={label}>
      <input required value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} className={inputCls} />
    </Field>
  )
  const dojang = (key: keyof api.DojangInput, label: string) => (
    <Field label={label}>
      <input required value={form.dojang[key]} onChange={(e) => setForm({ ...form, dojang: { ...form.dojang, [key]: e.target.value } })} className={inputCls} />
    </Field>
  )

  return (
    <form onSubmit={onSubmit} className="mt-4 space-y-4 border-t border-slate-100 pt-4">
      <div className="grid gap-3 sm:grid-cols-3">
        {user('name', '관장 이름')}
        {user('email', '이메일')}
        {user('phone', '관장 연락처')}
        {dojang('name', '도장명')}
        {dojang('address', '도장 주소')}
        {dojang('phone', '도장 연락처')}
      </div>
      <ErrorText>{error}</ErrorText>
      <div className="flex gap-2">
        <button className={btn.primary}>저장</button>
        <button type="button" onClick={onDone} className={btn.secondary}>취소</button>
      </div>
    </form>
  )
}

export default function AdminDojangs() {
  const masters = useAsync(api.getMasters, [])
  const [editing, setEditing] = useState<string | null>(null)

  return (
    <>
      <PageTitle>도장·관장 관리</PageTitle>
      <Async state={masters}>
        {(list) =>
          list.length === 0 ? (
            <Card><Empty>등록된 도장이 없습니다.</Empty></Card>
          ) : (
            <div className="space-y-3">
              {list.map((m) => (
                <Card key={m.user.id}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="font-semibold">
                        {m.dojang?.name ?? '(도장 없음)'}
                        <span className="ml-2 text-xs font-normal text-slate-400">{USER_STATUS_LABEL[m.user.status]}</span>
                      </h2>
                      <p className="text-sm text-slate-500">{m.dojang?.address} · {m.dojang?.phone}</p>
                      <p className="text-sm text-slate-500">관장 {m.user.name} · {m.user.email} · {m.user.phone}</p>
                    </div>
                    {editing !== m.user.id && <button onClick={() => setEditing(m.user.id)} className={btn.small}>수정</button>}
                  </div>
                  {editing === m.user.id && <EditForm m={m} onDone={() => { setEditing(null); masters.reload() }} />}
                </Card>
              ))}
            </div>
          )
        }
      </Async>
    </>
  )
}
