import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import * as api from '../../api'
import { Async, Card, Empty, ErrorText, Field, PageTitle, btn, inputCls } from '../../components/ui'
import { formatDate } from '../../labels'
import type { Notice } from '../../types'
import { act, useAsync } from '../../useAsync'

function NoticeForm({ initial, onSave, onCancel }: { initial: api.NoticeInput; onSave: (v: api.NoticeInput) => Promise<unknown>; onCancel: () => void }) {
  const [form, setForm] = useState(initial)
  const [error, setError] = useState('')

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    try {
      await onSave(form)
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <Field label="제목"><input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputCls} /></Field>
      <Field label="본문"><textarea required rows={6} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} className={inputCls} /></Field>
      <ErrorText>{error}</ErrorText>
      <div className="flex gap-2">
        <button className={btn.primary}>저장</button>
        <button type="button" onClick={onCancel} className={btn.secondary}>취소</button>
      </div>
    </form>
  )
}

export default function AdminNotices() {
  const notices = useAsync(api.getNotices, [])
  const [editing, setEditing] = useState<string | null>(null) // 'new' 또는 공지 id

  const done = () => {
    setEditing(null)
    notices.reload()
  }
  const onDelete = (n: Notice) => {
    if (confirm(`'${n.title}'을(를) 삭제할까요?`)) act(() => api.deleteNotice(n.id), notices.reload)
  }

  return (
    <>
      <PageTitle action={editing !== 'new' && <button onClick={() => setEditing('new')} className={btn.primary}>공지 추가</button>}>공지사항 관리</PageTitle>
      {editing === 'new' && (
        <Card className="mb-6">
          <NoticeForm initial={{ title: '', content: '' }} onSave={async (v) => { await api.createNotice(v); done() }} onCancel={() => setEditing(null)} />
        </Card>
      )}
      <Async state={notices}>
        {(list) =>
          list.length === 0 ? (
            <Card><Empty>공지사항이 없습니다.</Empty></Card>
          ) : (
            <div className="space-y-3">
              {list.map((n) => (
                <Card key={n.id}>
                  {editing === n.id ? (
                    <NoticeForm initial={{ title: n.title, content: n.content }} onSave={async (v) => { await api.updateNotice(n.id, v); done() }} onCancel={() => setEditing(null)} />
                  ) : (
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link to={`/notices/${n.id}`} className="font-semibold hover:text-brand">{n.title}</Link>
                        <p className="text-sm text-slate-400">{formatDate(n.createdAt)}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setEditing(n.id)} className={btn.small}>수정</button>
                        <button onClick={() => onDelete(n)} className={btn.danger}>삭제</button>
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )
        }
      </Async>
    </>
  )
}
