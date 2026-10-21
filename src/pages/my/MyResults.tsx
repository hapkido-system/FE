import { Link } from 'react-router'
import * as api from '../../api'
import { RankingTable } from '../../components/BracketView'
import { Async, Card, Empty, PageTitle, Table, TournamentBadge, td } from '../../components/ui'
import { DIVISION_LABEL } from '../../labels'
import { useAuth } from '../../store/auth'
import { useAsync } from '../../useAsync'

export default function MyResults() {
  const dojangId = useAuth((s) => s.me?.dojang?.id)
  const results = useAsync(api.getMyResults, [])

  return (
    <>
      <PageTitle>우리 도장 경기 결과</PageTitle>
      <Async state={results}>
        {(list) =>
          list.length === 0 ? (
            <Card><Empty>대진표가 공개된 대회 중 우리 도장 선수가 참가한 대회가 없습니다.</Empty></Card>
          ) : (
            <div className="space-y-6">
              {list.map(({ tournament: t, brackets, rankings }) => (
                <Card key={t.id}>
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                    <Link to={`/tournaments/${t.id}`} className="font-semibold hover:text-brand">{t.title}</Link>
                    <TournamentBadge status={t.status} />
                  </div>
                  {rankings.length > 0 && (
                    <div className="mb-6">
                      <h3 className="mb-2 text-sm font-semibold text-slate-500">최종 순위</h3>
                      <RankingTable rankings={rankings} highlightDojangId={dojangId} />
                    </div>
                  )}
                  <h3 className="mb-2 text-sm font-semibold text-slate-500">우리 도장 선수 경기</h3>
                  <Table head={['부별', '라운드', '우리 선수', '상대', '결과']}>
                    {brackets.flatMap(({ bracket, matches, players }) => {
                      const total = Math.max(...matches.map((m) => m.round))
                      return matches.flatMap((m) =>
                        [m.player1Id, m.player2Id]
                          .filter((id): id is string => !!id && players[id]?.dojangId === dojangId)
                          .map((id) => {
                            const oppId = id === m.player1Id ? m.player2Id : m.player1Id
                            const opp = oppId ? players[oppId] : null
                            return (
                              <tr key={`${m.id}-${id}`}>
                                <td className={td}>{DIVISION_LABEL[bracket.division]}</td>
                                <td className={td}>{m.round === total ? '결승' : `${m.round}라운드`}</td>
                                <td className={`${td} font-medium`}>{players[id].name}</td>
                                <td className={td}>{opp ? `${opp.name} (${opp.dojangName})` : '미정'}</td>
                                <td className={td}>
                                  {m.winnerId === null ? (
                                    <span className="text-slate-400">경기 전</span>
                                  ) : m.winnerId === id ? (
                                    <span className="font-semibold text-brand">승</span>
                                  ) : (
                                    <span className="text-slate-500">패</span>
                                  )}
                                </td>
                              </tr>
                            )
                          }),
                      )
                    })}
                  </Table>
                </Card>
              ))}
            </div>
          )
        }
      </Async>
    </>
  )
}
