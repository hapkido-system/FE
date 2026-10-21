// 실행: npm run check
import assert from 'node:assert/strict'
import { applyWinner, buildMatches, finalStandings } from './bracket.ts'

let seq = 0
const matches = buildMatches('b', ['a', 'b', 'c', 'd'], () => `m${++seq}`)
assert.equal(matches.length, 3)
const [m1, m2, final] = matches
assert.equal(m1.nextMatchId, final.id)
assert.equal(m2.nextSlot, 2)

assert.throws(() => applyWinner(matches, final.id, 'a'), /두 선수/)
assert.throws(() => applyWinner(matches, m1.id, 'c'), /이 경기의 선수/)

applyWinner(matches, m1.id, 'a')
applyWinner(matches, m2.id, 'd')
assert.equal(final.player1Id, 'a')
assert.equal(final.player2Id, 'd')

// 다음 경기 결과 입력 전에는 승자 변경 가능, 다음 경기 자리도 갱신
applyWinner(matches, m1.id, 'b')
assert.equal(final.player1Id, 'b')

applyWinner(matches, final.id, 'd')
assert.throws(() => applyWinner(matches, m1.id, 'a'), /다음 경기 결과/)
assert.deepEqual(finalStandings(matches), { first: 'd', second: 'b' })

assert.throws(() => buildMatches('b', ['a', 'b', 'c'], () => 'x'), /2의 거듭제곱/)
console.log('bracket check ok')
