import { Link } from 'react-router'
import * as api from '../api'
import { Async, Card, Empty, TournamentBadge } from '../components/ui'
import { formatDate } from '../labels'
import { useAsync } from '../useAsync'

export default function Home() {
  const tournaments = useAsync(api.getTournaments, [])
  const notices = useAsync(api.getNotices, [])

  return (
    <div className="space-y-10">
      <section className="rounded-2xl bg-brand px-6 py-10 text-white sm:px-10">
        <p className="mb-2 text-sm font-medium text-white/70">Gwangjin-gu Hapkido Association</p>
        <h1 className="text-2xl font-bold sm:text-3xl">광진구합기도협회 대회 신청</h1>
        <p className="mt-3 text-sm text-white/80">대회 정보와 대진표, 결과를 확인하고 도장 단위로 참가를 신청하세요.</p>
      </section>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="mb-4 text-lg font-bold">대회</h2>
          <Async state={tournaments}>
            {(list) =>
              list.length === 0 ? (
                <Empty>등록된 대회가 없습니다.</Empty>
              ) : (
                <ul className="space-y-3">
                  {list.map((t) => (
                    <li key={t.id}>
                      <Link to={`/tournaments/${t.id}`} className="block rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-brand/40 hover:shadow">
                        <div className="mb-2 flex items-start justify-between gap-3">
                          <h3 className="font-semibold text-slate-900">{t.title}</h3>
                          <TournamentBadge status={t.status} />
                        </div>
                        <p className="text-sm text-slate-500">
                          대회일 {formatDate(t.eventDate)} · {t.location}
                        </p>
                        <p className="text-sm text-slate-500">
                          접수 {formatDate(t.applyStartAt)} ~ {formatDate(t.applyEndAt)}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              )
            }
          </Async>
        </div>

        <div>
          <h2 className="mb-4 text-lg font-bold">공지사항</h2>
          <Card className="p-0">
            <Async state={notices}>
              {(list) =>
                list.length === 0 ? (
                  <Empty>공지사항이 없습니다.</Empty>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {list.map((n) => (
                      <li key={n.id}>
                        <Link to={`/notices/${n.id}`} className="block px-5 py-3 hover:bg-slate-50">
                          <p className="truncate text-sm font-medium text-slate-800">{n.title}</p>
                          <p className="text-xs text-slate-400">{formatDate(n.createdAt)}</p>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )
              }
            </Async>
          </Card>
        </div>
      </div>
    </div>
  )
}
