import type {
  Application,
  Bracket,
  Division,
  Dojang,
  Gender,
  Match,
  Notice,
  Student,
  Tournament,
  TournamentStatus,
  User,
} from '../types'
import { buildMatches } from './bracket'

export interface Db {
  users: User[]
  dojangs: Dojang[]
  students: Student[]
  tournaments: Tournament[]
  applications: Application[]
  brackets: Bracket[]
  matches: Match[]
  notices: Notice[]
}

const at = (date: string) => `${date}T09:00:00.000Z`

export function createSeed(): Db {
  const users: User[] = [
    { id: 'u-admin', email: 'admin@gjha.kr', name: '협회관리자', phone: '02-000-0000', role: 'ADMIN', status: 'APPROVED', createdAt: at('2026-01-01') },
    { id: 'u-kim', email: 'kim@dojang.kr', name: '김관장', phone: '010-1111-1111', role: 'MASTER', status: 'APPROVED', createdAt: at('2026-02-01') },
    { id: 'u-park', email: 'park@dojang.kr', name: '박관장', phone: '010-2222-2222', role: 'MASTER', status: 'APPROVED', createdAt: at('2026-02-03') },
    { id: 'u-lee', email: 'lee@dojang.kr', name: '이관장', phone: '010-3333-3333', role: 'MASTER', status: 'PENDING', createdAt: at('2026-10-10') },
    { id: 'u-choi', email: 'choi@dojang.kr', name: '최관장', phone: '010-4444-4444', role: 'MASTER', status: 'REJECTED', createdAt: at('2026-09-20') },
  ]

  const dojangs: Dojang[] = [
    { id: 'd-kim', ownerUserId: 'u-kim', name: '자양합기도', address: '서울 광진구 자양로 100', phone: '02-111-1111' },
    { id: 'd-park', ownerUserId: 'u-park', name: '구의합기도', address: '서울 광진구 구의로 200', phone: '02-222-2222' },
    { id: 'd-lee', ownerUserId: 'u-lee', name: '화양합기도', address: '서울 광진구 화양로 300', phone: '02-333-3333' },
    { id: 'd-choi', ownerUserId: 'u-choi', name: '중곡합기도', address: '서울 광진구 중곡로 400', phone: '02-444-4444' },
  ]

  const roster: [string, Gender, Division, string][][] = [
    [
      ['김민준', 'MALE', 'ELEMENTARY', '2015-03-14'], ['김서연', 'FEMALE', 'ELEMENTARY', '2016-07-02'],
      ['김도윤', 'MALE', 'ELEMENTARY', '2017-11-21'], ['김하은', 'FEMALE', 'ELEMENTARY', '2018-05-09'],
      ['김지호', 'MALE', 'MIDDLE', '2012-01-30'], ['김수아', 'FEMALE', 'MIDDLE', '2013-08-17'],
      ['김현우', 'MALE', 'HIGH', '2009-04-05'], ['김지유', 'FEMALE', 'HIGH', '2010-12-11'],
    ],
    [
      ['박시우', 'MALE', 'ELEMENTARY', '2015-09-23'], ['박지아', 'FEMALE', 'ELEMENTARY', '2016-02-18'],
      ['박예준', 'MALE', 'ELEMENTARY', '2017-06-27'], ['박채원', 'FEMALE', 'ELEMENTARY', '2018-10-03'],
      ['박준서', 'MALE', 'MIDDLE', '2012-06-12'], ['박윤서', 'FEMALE', 'MIDDLE', '2013-03-29'],
      ['박건우', 'MALE', 'HIGH', '2009-10-08'], ['박다은', 'FEMALE', 'HIGH', '2010-07-15'],
    ],
  ]
  const students: Student[] = roster.flatMap((list, d) =>
    list.map(([name, gender, division, birthDate], i) => ({
      id: `s-${d === 0 ? 'kim' : 'park'}-${i + 1}`,
      dojangId: d === 0 ? 'd-kim' : 'd-park',
      name,
      birthDate,
      gender,
      division,
    })),
  )

  const t = (id: string, title: string, status: TournamentStatus, eventDate: string, applyStartAt: string, applyEndAt: string): Tournament => ({
    id,
    title,
    description: `${title}에 광진구 관내 도장 수련생 여러분의 많은 참여 바랍니다.`,
    location: '광진구민체육센터',
    eventDate: at(eventDate),
    applyStartAt: at(applyStartAt),
    applyEndAt: at(applyEndAt),
    status,
    createdAt: at('2026-01-10'),
  })
  const tournaments: Tournament[] = [
    t('t-upcoming', '2027 광진구청장배 합기도 대회', 'UPCOMING', '2027-03-20', '2027-02-01', '2027-02-28'),
    t('t-open', '제5회 광진구 꿈나무 합기도 대회', 'OPEN', '2026-11-29', '2026-10-15', '2026-11-10'),
    t('t-closed', '2026 광진구 가을 합기도 대회', 'CLOSED', '2026-11-08', '2026-09-20', '2026-10-15'),
    t('t-published', '2026 광진구 협회장배 합기도 대회', 'BRACKET_PUBLISHED', '2026-10-31', '2026-09-01', '2026-09-30'),
    t('t-progress', '2026 광진구 학생 합기도 선수권', 'IN_PROGRESS', '2026-10-21', '2026-08-20', '2026-09-20'),
    t('t-finished', '2026 광진구 여름 합기도 대회', 'FINISHED', '2026-07-25', '2026-06-01', '2026-06-30'),
  ]

  const applications: Application[] = []
  const apply = (tournamentId: string, s: Student, status: Application['status'], rejectReason: string | null = null) => {
    const app: Application = {
      id: `a-${tournamentId}-${s.id}`,
      tournamentId,
      dojangId: s.dojangId,
      studentId: s.id,
      playerName: s.name,
      gender: s.gender,
      division: s.division,
      status,
      rejectReason,
      createdAt: at('2026-10-16'),
    }
    applications.push(app)
    return app
  }

  // 접수중 대회: 승인 대기·확정·반려, 학생 선택·직접 입력 혼합
  apply('t-open', students[0], 'PENDING')
  apply('t-open', students[1], 'APPROVED')
  apply('t-open', students[4], 'REJECTED', '참가 부별 정보가 학적과 일치하지 않습니다.')
  apply('t-open', students[8], 'APPROVED')
  apply('t-open', students[12], 'PENDING')
  applications.push(
    { id: 'a-t-open-direct-1', tournamentId: 't-open', dojangId: 'd-kim', studentId: null, playerName: '정우진', gender: 'MALE', division: 'HIGH', status: 'PENDING', rejectReason: null, createdAt: at('2026-10-17') },
    { id: 'a-t-open-direct-2', tournamentId: 't-open', dojangId: 'd-park', studentId: null, playerName: '한소율', gender: 'FEMALE', division: 'MIDDLE', status: 'APPROVED', rejectReason: null, createdAt: at('2026-10-18') },
  )

  // 접수 마감 대회
  apply('t-closed', students[2], 'APPROVED')
  apply('t-closed', students[3], 'PENDING')
  apply('t-closed', students[9], 'APPROVED')

  // 대진표가 있는 대회: 학생 16명 전원 참가 확정 → 초등부 8명, 중등부 4명, 고등부 4명
  const brackets: Bracket[] = []
  const matches: Match[] = []
  const bracketTournaments: [string, 'none' | 'round1' | 'all'][] = [
    ['t-published', 'none'],
    ['t-progress', 'round1'],
    ['t-finished', 'all'],
  ]
  for (const [tid, filled] of bracketTournaments) {
    const apps = students.map((s) => apply(tid, s, 'APPROVED'))
    for (const division of ['ELEMENTARY', 'MIDDLE', 'HIGH'] as Division[]) {
      // 두 도장 선수가 번갈아 배치되도록 정렬
      const kim = apps.filter((a) => a.division === division && a.dojangId === 'd-kim')
      const park = apps.filter((a) => a.division === division && a.dojangId === 'd-park')
      const ids = kim.flatMap((a, i) => [a.id, park[i].id])
      const bracket: Bracket = { id: `b-${tid}-${division}`, tournamentId: tid, division, gender: null }
      let seq = 0
      const ms = buildMatches(bracket.id, ids, () => `${bracket.id}-m${++seq}`)
      if (filled !== 'none') {
        const maxRound = filled === 'round1' ? 1 : Infinity
        for (const m of ms) {
          if (m.round > maxRound || !m.player1Id || !m.player2Id) continue
          // 시드 결과: 라운드·순서에 따라 번갈아 승자 지정
          m.winnerId = (m.round + m.position) % 2 === 0 ? m.player1Id : m.player2Id
          const next = ms.find((x) => x.id === m.nextMatchId)
          if (next) next[m.nextSlot === 1 ? 'player1Id' : 'player2Id'] = m.winnerId
        }
      }
      brackets.push(bracket)
      matches.push(...ms)
    }
  }

  const notices: Notice[] = [
    { id: 'n-1', title: '제5회 광진구 꿈나무 합기도 대회 참가 신청 안내', content: '제5회 광진구 꿈나무 합기도 대회 참가 신청을 11월 10일까지 받습니다.\n도장 관리 페이지에서 학생을 등록한 뒤 대회 상세 화면에서 신청해 주세요.', authorId: 'u-admin', createdAt: at('2026-10-15') },
    { id: 'n-2', title: '2026 광진구 학생 합기도 선수권 대진표 공개', content: '부별 대진표가 공개되었습니다. 대회 상세 화면에서 확인해 주세요.', authorId: 'u-admin', createdAt: at('2026-10-01') },
    { id: 'n-3', title: '관장 회원가입 및 승인 절차 안내', content: '관장님께서 직접 회원가입하시면 협회 관리자 확인 후 승인됩니다.\n승인 후 도장 관리와 대회 신청 기능을 이용하실 수 있습니다.', authorId: 'u-admin', createdAt: at('2026-09-01') },
    { id: 'n-4', title: '2026 광진구 여름 합기도 대회 결과 안내', content: '참가해 주신 모든 선수와 관장님께 감사드립니다. 부별 순위는 대회 상세 화면에서 확인하실 수 있습니다.', authorId: 'u-admin', createdAt: at('2026-07-28') },
  ]

  return { users, dojangs, students, tournaments, applications, brackets, matches, notices }
}
