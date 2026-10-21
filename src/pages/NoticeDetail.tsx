import { Link, useParams } from 'react-router'
import * as api from '../api'
import { Async, Card } from '../components/ui'
import { formatDate } from '../labels'
import { useAsync } from '../useAsync'

export default function NoticeDetail() {
  const { id = '' } = useParams()
  const notice = useAsync(() => api.getNotice(id), [id])

  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/" className="mb-4 inline-block text-sm text-slate-500 hover:text-brand">← 목록으로</Link>
      <Async state={notice}>
        {(n) => (
          <Card>
            <h1 className="text-xl font-bold">{n.title}</h1>
            <p className="mt-1 text-sm text-slate-400">{formatDate(n.createdAt)}</p>
            <div className="mt-6 whitespace-pre-line border-t border-slate-100 pt-6 text-slate-700">{n.content}</div>
          </Card>
        )}
      </Async>
    </div>
  )
}
