import { Link, useNavigate, useParams } from 'react-router'
import * as api from '../api'
import { BracketList, RankingTable } from '../components/BracketView'
import { AppStatusBadge, Async, Card, Empty, TournamentBadge, btn } from '../components/ui'
import { DIVISION_LABEL, GENDER_LABEL, formatDate } from '../labels'
import { useAuth } from '../store/auth'
import type { Tournament } from '../types'
import { act, useAsync } from '../useAsync'

function MyApplicationList({ tournamentId, editable }: { tournamentId: string; editable: boolean }) {
  const apps = useAsync(() => api.getMyApplications(tournamentId), [tournamentId])
  return (
    <Async state={apps}>
      {(list) =>
        list.length === 0 ? (
          <Empty>신청한 선수가 없습니다.</Empty>
        ) : (
          <ul className="divide-y divide-slate-100">
            {list.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div>
                  <span className="font-medium">{a.playerName}</span>
                  <span className="ml-2 text-sm text-slate-500">
                    {GENDER_LABEL[a.gender]} · {DIVISION_LABEL[a.division]}
                  </span>
                  {a.rejectReason && <p className="mt-1 text-sm text-red-600">반려 사유: {a.rejectReason}</p>}
                </div>
                <AppStatusBadge status={a.status} />
              </li>
            ))}
            {editable && (
              <li className="pt-3 text-sm text-slate-500">
                수정·취소는 <Link to="/my/applications" className="text-brand underline">대회 신청 내역</Link>에서 할 수 있습니다.
              </li>
            )}
          </ul>
        )
      }
    </Async>
  )
}

function Brackets({ tournamentId, highlightDojangId }: { tournamentId: string; highlightDojangId?: string }) {
  const brackets = useAsync(() => api.getBrackets(tournamentId), [tournamentId])
  return <Async state={brackets}>{(list) => <BracketList details={list} highlightDojangId={highlightDojangId} />}</Async>
}

function Rankings({ tournamentId, highlightDojangId }: { tournamentId: string; highlightDojangId?: string }) {
  const rankings = useAsync(() => api.getRankings(tournamentId), [tournamentId])
  return <Async state={rankings}>{(list) => <RankingTable rankings={list} highlightDojangId={highlightDojangId} />}</Async>
}

function StatusSection({ t, reload }: { t: Tournament; reload: () => void }) {
  const me = useAuth((s) => s.me)
  const navigate = useNavigate()
  const role = me?.user.role
  const isAdmin = role === 'ADMIN'
  const approvedMaster = role === 'MASTER' && me?.user.status === 'APPROVED'
  const ourDojangId = approvedMaster ? me?.dojang?.id : undefined
  const ourLegend = ourDojangId && (
    <p className="mb-4 text-sm text-slate-500">
      <span className="mr-1 inline-block h-2 w-2 rounded-full bg-accent" /> 표시는 우리 도장 선수입니다.
    </p>
  )

  const onApply = () => {
    if (!me) navigate(`/login?redirect=${encodeURIComponent(`/tournaments/${t.id}`)}`)
    else navigate(`/tournaments/${t.id}/apply`)
  }

  const onClose = () => {
    if (confirm('접수를 마감할까요?')) act(() => api.advanceTournamentStatus(t.id), reload)
  }

  switch (t.status) {
    case 'UPCOMING':
      return (
        <Card>
          <p className="text-slate-700">접수는 <b>{formatDate(t.applyStartAt)}</b>부터 시작됩니다.</p>
          {isAdmin && <Link to="/admin/tournaments" className={`${btn.secondary} mt-4`}>대회 정보 수정</Link>}
        </Card>
      )

    case 'OPEN':
      return (
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold">참가 신청</h2>
            {isAdmin ? (
              <div className="flex gap-2">
                <Link to={`/admin/tournaments/${t.id}/applications`} className={btn.primary}>신청 승인·반려</Link>
                <button onClick={onClose} className={btn.secondary}>조기 마감</button>
              </div>
            ) : (
              <button onClick={onApply} className={btn.primary}>신청하기</button>
            )}
          </div>
          <p className="mt-2 text-sm text-slate-500">접수 기간 {formatDate(t.applyStartAt)} ~ {formatDate(t.applyEndAt)}</p>
          {approvedMaster && (
            <div className="mt-6 border-t border-slate-100 pt-4">
              <h3 className="mb-1 font-semibold">내 신청 상태</h3>
              <MyApplicationList tournamentId={t.id} editable />
            </div>
          )}
        </Card>
      )

    case 'CLOSED':
      return (
        <Card>
          <h2 className="text-lg font-bold">접수가 마감되었습니다</h2>
          <p className="mt-1 text-sm text-slate-500">대진표 준비중입니다.</p>
          {isAdmin && <Link to={`/admin/tournaments/${t.id}/bracket`} className={`${btn.primary} mt-4`}>대진표 준비</Link>}
          {approvedMaster && (
            <div className="mt-6 border-t border-slate-100 pt-4">
              <h3 className="mb-1 font-semibold">신청 내역 (수정 불가)</h3>
              <MyApplicationList tournamentId={t.id} editable={false} />
            </div>
          )}
        </Card>
      )

    case 'BRACKET_PUBLISHED':
    case 'IN_PROGRESS':
      return (
        <Card>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold">대진표</h2>
            {isAdmin && <Link to={`/admin/tournaments/${t.id}/bracket`} className={btn.primary}>경기 결과 입력</Link>}
          </div>
          {ourLegend}
          <Brackets tournamentId={t.id} highlightDojangId={ourDojangId} />
        </Card>
      )

    case 'FINISHED':
      return (
        <div className="space-y-6">
          <Card>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-bold">부별 최종 순위</h2>
              {approvedMaster && <Link to="/my/results" className={btn.secondary}>우리 도장 결과</Link>}
            </div>
            {ourLegend && <p className="mb-4 text-sm text-slate-500">강조 표시는 우리 도장 선수입니다.</p>}
            <Rankings tournamentId={t.id} highlightDojangId={ourDojangId} />
          </Card>
          <Card>
            <h2 className="mb-4 text-lg font-bold">대진표</h2>
            <Brackets tournamentId={t.id} highlightDojangId={ourDojangId} />
          </Card>
        </div>
      )
  }
}

export default function TournamentDetail() {
  const { id = '' } = useParams()
  const tournament = useAsync(() => api.getTournament(id), [id])

  return (
    <div className="space-y-6">
      <Link to="/" className="inline-block text-sm text-slate-500 hover:text-brand">← 목록으로</Link>
      <Async state={tournament}>
        {(t) => (
          <>
            <Card>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <h1 className="text-2xl font-bold">{t.title}</h1>
                <TournamentBadge status={t.status} />
              </div>
              {t.description && <p className="mt-3 whitespace-pre-line text-slate-600">{t.description}</p>}
              <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
                <div>
                  <dt className="text-slate-400">대회일</dt>
                  <dd className="font-medium">{formatDate(t.eventDate)}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">장소</dt>
                  <dd className="font-medium">{t.location}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">접수 기간</dt>
                  <dd className="font-medium">{formatDate(t.applyStartAt)} ~ {formatDate(t.applyEndAt)}</dd>
                </div>
              </dl>
            </Card>
            <StatusSection t={t} reload={tournament.reload} />
          </>
        )}
      </Async>
    </div>
  )
}
