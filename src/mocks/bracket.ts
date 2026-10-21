import type { Match } from '../types'

// 참가 인원이 2의 거듭제곱일 때만 동작 (TODO(미정): 부전승)
export function buildMatches(bracketId: string, playerIds: string[], newId: () => string): Match[] {
  const n = playerIds.length
  if (n < 2 || (n & (n - 1)) !== 0) throw new Error('참가 인원이 2의 거듭제곱이어야 합니다.')
  const rounds: Match[][] = []
  for (let size = n / 2, round = 1; size >= 1; size /= 2, round++) {
    rounds.push(
      Array.from({ length: size }, (_, i) => ({
        id: newId(),
        bracketId,
        round,
        position: i + 1,
        player1Id: round === 1 ? playerIds[i * 2] : null,
        player2Id: round === 1 ? playerIds[i * 2 + 1] : null,
        winnerId: null,
        nextMatchId: null,
        nextSlot: null,
      })),
    )
  }
  for (let r = 0; r < rounds.length - 1; r++) {
    rounds[r].forEach((m, i) => {
      m.nextMatchId = rounds[r + 1][Math.floor(i / 2)].id
      m.nextSlot = i % 2 === 0 ? 1 : 2
    })
  }
  return rounds.flat()
}

// matches를 직접 수정. 실패하면 Error를 던짐
export function applyWinner(matches: Match[], matchId: string, winnerId: string): void {
  const match = matches.find((m) => m.id === matchId)
  if (!match) throw new Error('경기를 찾을 수 없습니다.')
  if (!match.player1Id || !match.player2Id) throw new Error('두 선수가 모두 정해진 경기만 결과를 입력할 수 있습니다.')
  if (winnerId !== match.player1Id && winnerId !== match.player2Id) throw new Error('이 경기의 선수가 아닙니다.')
  if (match.winnerId === winnerId) return
  const next = match.nextMatchId ? matches.find((m) => m.id === match.nextMatchId) : undefined
  if (next?.winnerId) throw new Error('다음 경기 결과가 이미 입력되어 있어 승자를 바꿀 수 없습니다.')
  match.winnerId = winnerId
  if (next) next[match.nextSlot === 1 ? 'player1Id' : 'player2Id'] = winnerId
}

export function finalStandings(matches: Match[]): { first: string | null; second: string | null } {
  const final = matches.find((m) => m.nextMatchId === null)
  if (!final?.winnerId) return { first: null, second: null }
  return { first: final.winnerId, second: final.winnerId === final.player1Id ? final.player2Id : final.player1Id }
}
