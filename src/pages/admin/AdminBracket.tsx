import { Link, useParams } from 'react-router'
import * as api from '../../api'
import { BracketList, RankingTable } from '../../components/BracketView'
import { Async, Card, PageTitle, TournamentBadge } from '../../components/ui'
import type { Match } from '../../types'
import { act, useAsync } from '../../useAsync'

export default function AdminBracket() {
  const { id = '' } = useParams()
  const data = useAsync(() => Promise.all([api.getTournament(id), api.getBrackets(id)]), [id])
  const rankings = useAsync(() => api.getRankings(id).catch(() => []), [id])

  return (
    <>
      <Link to="/admin/tournaments" className="mb-4 inline-block text-sm text-slate-500 hover:text-brand">← 대회 관리</Link>
      <Async state={data}>
        {([t, brackets]) => {
          const editable = t.status === 'BRACKET_PUBLISHED' || t.status === 'IN_PROGRESS'
          const onPick = (m: Match, winnerId: string) => act(() => api.setMatchWinner(m.id, winnerId), data.reload)
          return (
            <>
              <PageTitle action={<TournamentBadge status={t.status} />}>대진표 관리</PageTitle>
              <p className="-mt-4 mb-6 text-slate-600">{t.title}</p>
              {t.status === 'FINISHED' && (
                <Card className="mb-6">
                  <h2 className="mb-4 font-semibold">부별 최종 순위</h2>
                  <Async state={rankings}>{(list) => <RankingTable rankings={list} />}</Async>
                </Card>
              )}
              <Card>
                {editable ? (
                  <p className="mb-4 text-sm text-slate-500">선수 이름을 누르면 그 선수를 승자로 지정합니다. 다음 경기 결과가 입력된 경기는 바꿀 수 없습니다.</p>
                ) : t.status === 'FINISHED' ? null : (
                  <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
                    경기 결과는 대진표 공개·경기 진행중 상태에서 입력할 수 있습니다.
                    {/* TODO(미정): 대진 생성 방식이 정해지면 여기서 api.generateBrackets 호출 */}
                    {brackets.length === 0 && ' 대진 생성 방식이 정해지지 않아 아직 대진표를 만들 수 없습니다.'}
                  </p>
                )}
                <BracketList details={brackets} onPick={editable ? onPick : undefined} />
              </Card>
            </>
          )
        }}
      </Async>
    </>
  )
}
