// 컴포넌트는 이 모듈의 함수만 호출합니다. 지금은 mock 구현이며, 내부만 HTTP 호출로 바꾸면 됩니다.
import { applyWinner, finalStandings } from '../mocks/bracket'
import { db, getSessionUserId, resetDb, saveDb, setSessionUserId } from '../mocks/db'
import { DIVISIONS } from '../labels'
import type {
  Application,
  ApplicationWithDojang,
  BracketDetail,
  Dojang,
  Gender,
  Division,
  MasterWithDojang,
  Me,
  Notice,
  PlayerInput,
  Ranking,
  Student,
  Tournament,
  TournamentStatus,
  User,
} from '../types'

export class ApiError extends Error {}

const now = () => new Date().toISOString()
const newId = (prefix: string) => `${prefix}-${crypto.randomUUID().slice(0, 8)}`

// 각 함수는 검증을 모두 끝낸 뒤에 데이터를 수정합니다
async function run<T>(fn: () => T): Promise<T> {
  await new Promise((r) => setTimeout(r, 120))
  const result = fn()
  saveDb()
  return structuredClone(result)
}

function find<T extends { id: string }>(list: T[], id: string, label: string): T {
  const item = list.find((x) => x.id === id)
  if (!item) throw new ApiError(`${label}을(를) 찾을 수 없습니다.`)
  return item
}

function required(value: string, label: string): string {
  const v = value.trim()
  if (!v) throw new ApiError(`${label}을(를) 입력해 주세요.`)
  return v
}

const isGender = (g: string): g is Gender => g === 'MALE' || g === 'FEMALE'
const isDivision = (d: string): d is Division => (DIVISIONS as string[]).includes(d)

// ---------- 인증 / 권한 ----------

function currentUser(): User | null {
  const id = getSessionUserId()
  return db.users.find((u) => u.id === id) ?? null
}

function requireAdmin(): User {
  const user = currentUser()
  if (!user) throw new ApiError('로그인이 필요합니다.')
  if (user.role !== 'ADMIN') throw new ApiError('권한이 없습니다.')
  return user
}

function requireMaster(): { user: User; dojang: Dojang } {
  const user = currentUser()
  if (!user) throw new ApiError('로그인이 필요합니다.')
  if (user.role !== 'MASTER') throw new ApiError('관장 계정만 이용할 수 있습니다.')
  if (user.status !== 'APPROVED') throw new ApiError('가입 승인 후 이용할 수 있습니다.')
  const dojang = db.dojangs.find((d) => d.ownerUserId === user.id)
  if (!dojang) throw new ApiError('도장 정보를 찾을 수 없습니다.')
  return { user, dojang }
}

const toMe = (user: User): Me => ({ user, dojang: db.dojangs.find((d) => d.ownerUserId === user.id) ?? null })

export const getMe = () =>
  run((): Me | null => {
    const user = currentUser()
    return user ? toMe(user) : null
  })

export const login = (email: string) =>
  run((): Me => {
    // mock: 비밀번호는 검사하지 않음
    const user = db.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase())
    if (!user) throw new ApiError('등록되지 않은 이메일입니다.')
    setSessionUserId(user.id)
    return toMe(user)
  })

export const logout = () => run(() => setSessionUserId(null))

export interface SignupInput {
  name: string
  email: string
  password: string
  phone: string
  dojangName: string
  dojangAddress: string
  dojangPhone: string
}

export const signup = (input: SignupInput) =>
  run((): Me => {
    const email = required(input.email, '이메일')
    if (db.users.some((u) => u.email.toLowerCase() === email.toLowerCase())) throw new ApiError('이미 가입된 이메일입니다.')
    required(input.password, '비밀번호')
    const user: User = {
      id: newId('u'),
      email,
      name: required(input.name, '이름'),
      phone: required(input.phone, '연락처'),
      role: 'MASTER',
      status: 'PENDING',
      createdAt: now(),
    }
    const dojang: Dojang = {
      id: newId('d'),
      ownerUserId: user.id,
      name: required(input.dojangName, '도장명'),
      address: required(input.dojangAddress, '도장 주소'),
      phone: required(input.dojangPhone, '도장 연락처'),
    }
    db.users.push(user)
    db.dojangs.push(dojang)
    setSessionUserId(user.id)
    return { user, dojang }
  })

// 개발 모드 전용
export const getDevAccounts = () =>
  run(() => db.users.map(({ email, name, role, status }) => ({ email, name, role, status })))

export const resetMockData = async () => resetDb()

// ---------- 공지사항 ----------

export const getNotices = () => run(() => [...db.notices].sort((a, b) => b.createdAt.localeCompare(a.createdAt)))

export const getNotice = (id: string) => run(() => find(db.notices, id, '공지사항'))

export interface NoticeInput {
  title: string
  content: string
}

export const createNotice = (input: NoticeInput) =>
  run(() => {
    const admin = requireAdmin()
    const notice: Notice = {
      id: newId('n'),
      title: required(input.title, '제목'),
      content: required(input.content, '본문'),
      authorId: admin.id,
      createdAt: now(),
    }
    db.notices.push(notice)
    return notice
  })

export const updateNotice = (id: string, input: NoticeInput) =>
  run(() => {
    requireAdmin()
    const notice = find(db.notices, id, '공지사항')
    const title = required(input.title, '제목')
    const content = required(input.content, '본문')
    Object.assign(notice, { title, content })
    return notice
  })

export const deleteNotice = (id: string) =>
  run(() => {
    requireAdmin()
    find(db.notices, id, '공지사항')
    db.notices = db.notices.filter((n) => n.id !== id)
  })

// ---------- 대회 ----------

export const getTournaments = () => run(() => [...db.tournaments].sort((a, b) => b.eventDate.localeCompare(a.eventDate)))

export const getTournament = (id: string) => run(() => find(db.tournaments, id, '대회'))

export type TournamentInput = Pick<Tournament, 'title' | 'description' | 'location' | 'eventDate' | 'applyStartAt' | 'applyEndAt'>

function validTournament(input: TournamentInput): TournamentInput {
  const v = {
    title: required(input.title, '대회명'),
    description: input.description.trim(),
    location: required(input.location, '장소'),
    eventDate: required(input.eventDate, '대회일'),
    applyStartAt: required(input.applyStartAt, '접수 시작일'),
    applyEndAt: required(input.applyEndAt, '접수 마감일'),
  }
  if (v.applyStartAt > v.applyEndAt) throw new ApiError('접수 마감일은 접수 시작일 이후여야 합니다.')
  return v
}

export const createTournament = (input: TournamentInput) =>
  run(() => {
    requireAdmin()
    const tournament: Tournament = { id: newId('t'), ...validTournament(input), status: 'UPCOMING', createdAt: now() }
    db.tournaments.push(tournament)
    return tournament
  })

export const updateTournament = (id: string, input: TournamentInput) =>
  run(() => {
    requireAdmin()
    const tournament = find(db.tournaments, id, '대회')
    Object.assign(tournament, validTournament(input))
    return tournament
  })

export const deleteTournament = (id: string) =>
  run(() => {
    requireAdmin()
    find(db.tournaments, id, '대회')
    const bracketIds = new Set(db.brackets.filter((b) => b.tournamentId === id).map((b) => b.id))
    db.matches = db.matches.filter((m) => !bracketIds.has(m.bracketId))
    db.brackets = db.brackets.filter((b) => b.tournamentId !== id)
    db.applications = db.applications.filter((a) => a.tournamentId !== id)
    db.tournaments = db.tournaments.filter((t) => t.id !== id)
  })

const STATUS_FLOW: TournamentStatus[] = ['UPCOMING', 'OPEN', 'CLOSED', 'BRACKET_PUBLISHED', 'IN_PROGRESS', 'FINISHED']

// 프론트 단계: 접수 시작·마감도 관리자가 수동 전환. 바로 다음 상태로만 이동
export const advanceTournamentStatus = (id: string) =>
  run(() => {
    requireAdmin()
    const tournament = find(db.tournaments, id, '대회')
    const next = STATUS_FLOW[STATUS_FLOW.indexOf(tournament.status) + 1]
    if (!next) throw new ApiError('이미 종료된 대회입니다.')
    // TODO(미정): 마감 시 미승인 신청 처리. 지금은 상태를 바꾸지 않고 그대로 둠
    tournament.status = next
    return tournament
  })

// ---------- 도장 / 학생 (관장) ----------

export interface DojangInput {
  name: string
  address: string
  phone: string
}

export const getMyDojang = () => run(() => requireMaster().dojang)

export const updateMyDojang = (input: DojangInput) =>
  run(() => {
    const { dojang } = requireMaster()
    const v = { name: required(input.name, '도장명'), address: required(input.address, '주소'), phone: required(input.phone, '연락처') }
    Object.assign(dojang, v)
    return dojang
  })

export type StudentInput = Pick<Student, 'name' | 'birthDate' | 'gender' | 'division'>

function validStudent(input: StudentInput): StudentInput {
  const birthDate = required(input.birthDate, '생년월일')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate) || Number.isNaN(Date.parse(birthDate))) throw new ApiError('생년월일 형식이 올바르지 않습니다.')
  if (birthDate > now().slice(0, 10)) throw new ApiError('생년월일은 오늘 이전이어야 합니다.')
  if (!isGender(input.gender)) throw new ApiError('성별을 선택해 주세요.')
  if (!isDivision(input.division)) throw new ApiError('부별을 선택해 주세요.')
  return { name: required(input.name, '이름'), birthDate, gender: input.gender, division: input.division }
}

function ownStudent(id: string): Student {
  const { dojang } = requireMaster()
  const student = find(db.students, id, '학생')
  if (student.dojangId !== dojang.id) throw new ApiError('권한이 없습니다.')
  return student
}

export const getMyStudents = () =>
  run(() => {
    const { dojang } = requireMaster()
    return db.students.filter((s) => s.dojangId === dojang.id)
  })

export const createStudent = (input: StudentInput) =>
  run(() => {
    const { dojang } = requireMaster()
    const student: Student = { id: newId('s'), dojangId: dojang.id, ...validStudent(input) }
    db.students.push(student)
    return student
  })

export const updateStudent = (id: string, input: StudentInput) =>
  run(() => {
    const student = ownStudent(id)
    Object.assign(student, validStudent(input))
    return student
  })

// 신청 기록은 신청 시점 값을 복사해 두었으므로 그대로 유지
export const deleteStudent = (id: string) =>
  run(() => {
    ownStudent(id)
    db.students = db.students.filter((s) => s.id !== id)
  })

// ---------- 참가 신청 ----------

function resolvePlayer(dojangId: string, tournamentId: string, input: PlayerInput, excludeAppId?: string) {
  if ('studentId' in input) {
    const student = find(db.students, input.studentId, '학생')
    if (student.dojangId !== dojangId) throw new ApiError('권한이 없습니다.')
    const dup = db.applications.some((a) => a.tournamentId === tournamentId && a.studentId === student.id && a.id !== excludeAppId)
    if (dup) throw new ApiError('이미 이 대회에 신청한 학생입니다.')
    return { studentId: student.id, playerName: student.name, gender: student.gender, division: student.division }
  }
  if (!isGender(input.gender)) throw new ApiError('성별을 선택해 주세요.')
  if (!isDivision(input.division)) throw new ApiError('부별을 선택해 주세요.')
  // TODO(미정): 직접 입력 선수를 학생 목록에 자동 추가할지. 지금은 추가하지 않음
  return { studentId: null, playerName: required(input.playerName, '선수 이름'), gender: input.gender, division: input.division }
}

function ownEditableApplication(id: string): Application {
  const { dojang } = requireMaster()
  const app = find(db.applications, id, '신청')
  if (app.dojangId !== dojang.id) throw new ApiError('권한이 없습니다.')
  const tournament = find(db.tournaments, app.tournamentId, '대회')
  if (tournament.status !== 'OPEN' || app.status !== 'PENDING')
    throw new ApiError('접수중인 대회의 승인 대기 신청만 수정·취소할 수 있습니다.')
  return app
}

export const getMyApplications = (tournamentId?: string) =>
  run(() => {
    const { dojang } = requireMaster()
    return db.applications.filter((a) => a.dojangId === dojang.id && (!tournamentId || a.tournamentId === tournamentId))
  })

export const createApplication = (tournamentId: string, input: PlayerInput) =>
  run(() => {
    const { dojang } = requireMaster()
    const tournament = find(db.tournaments, tournamentId, '대회')
    if (tournament.status !== 'OPEN') throw new ApiError('접수중인 대회만 신청할 수 있습니다.')
    const app: Application = {
      id: newId('a'),
      tournamentId,
      dojangId: dojang.id,
      ...resolvePlayer(dojang.id, tournamentId, input),
      status: 'PENDING',
      rejectReason: null,
      createdAt: now(),
    }
    db.applications.push(app)
    return app
  })

export const updateApplication = (id: string, input: PlayerInput) =>
  run(() => {
    const app = ownEditableApplication(id)
    Object.assign(app, resolvePlayer(app.dojangId, app.tournamentId, input, app.id))
    return app
  })

export const cancelApplication = (id: string) =>
  run(() => {
    ownEditableApplication(id)
    db.applications = db.applications.filter((a) => a.id !== id)
  })

const dojangName = (id: string) => db.dojangs.find((d) => d.id === id)?.name ?? '(삭제된 도장)'

export const getTournamentApplications = (tournamentId: string) =>
  run((): ApplicationWithDojang[] => {
    requireAdmin()
    return db.applications
      .filter((a) => a.tournamentId === tournamentId)
      .map((a) => ({ ...a, dojangName: dojangName(a.dojangId) }))
  })

function reviewableApplication(id: string): Application {
  requireAdmin()
  const app = find(db.applications, id, '신청')
  // TODO(미정): 마감 후 미승인 신청 처리. 지금은 접수중에만 승인·반려
  if (find(db.tournaments, app.tournamentId, '대회').status !== 'OPEN')
    throw new ApiError('접수중인 대회의 신청만 승인·반려할 수 있습니다.')
  return app
}

export const approveApplication = (id: string) =>
  run(() => {
    const app = reviewableApplication(id)
    Object.assign(app, { status: 'APPROVED', rejectReason: null })
    return app
  })

export const rejectApplication = (id: string, reason: string) =>
  run(() => {
    const app = reviewableApplication(id)
    Object.assign(app, { status: 'REJECTED', rejectReason: required(reason, '반려 사유') })
    return app
  })

// ---------- 대진표 ----------

const BRACKET_VISIBLE: TournamentStatus[] = ['BRACKET_PUBLISHED', 'IN_PROGRESS', 'FINISHED']

function bracketDetails(tournamentId: string): BracketDetail[] {
  return db.brackets
    .filter((b) => b.tournamentId === tournamentId)
    .sort((a, b) => DIVISIONS.indexOf(a.division) - DIVISIONS.indexOf(b.division))
    .map((bracket) => {
      const matches = db.matches
        .filter((m) => m.bracketId === bracket.id)
        .sort((a, b) => a.round - b.round || a.position - b.position)
      const players: BracketDetail['players'] = {}
      for (const m of matches) {
        for (const id of [m.player1Id, m.player2Id]) {
          const app = id ? db.applications.find((a) => a.id === id) : undefined
          if (app) players[app.id] = { name: app.playerName, dojangId: app.dojangId, dojangName: dojangName(app.dojangId) }
        }
      }
      return { bracket, matches, players }
    })
}

export const getBrackets = (tournamentId: string) =>
  run(() => {
    const tournament = find(db.tournaments, tournamentId, '대회')
    if (!BRACKET_VISIBLE.includes(tournament.status) && currentUser()?.role !== 'ADMIN')
      throw new ApiError('아직 대진표가 공개되지 않았습니다.')
    return bracketDetails(tournamentId)
  })

const toRankings = (details: BracketDetail[]): Ranking[] =>
  details.map(({ bracket, matches, players }) => {
    const { first, second } = finalStandings(matches)
    return { division: bracket.division, first: first ? players[first] : null, second: second ? players[second] : null }
  })

// TODO(미정): 3위 처리. 지금은 1·2위만
export const getRankings = (tournamentId: string) =>
  run(() => {
    if (find(db.tournaments, tournamentId, '대회').status !== 'FINISHED') throw new ApiError('대회 종료 후 순위가 공개됩니다.')
    return toRankings(bracketDetails(tournamentId))
  })

export const setMatchWinner = (matchId: string, winnerId: string) =>
  run(() => {
    requireAdmin()
    const match = find(db.matches, matchId, '경기')
    const bracket = find(db.brackets, match.bracketId, '대진표')
    const status = find(db.tournaments, bracket.tournamentId, '대회').status
    if (status !== 'BRACKET_PUBLISHED' && status !== 'IN_PROGRESS')
      throw new ApiError('대진표 공개·경기 진행중 상태에서만 결과를 입력할 수 있습니다.')
    try {
      applyWinner(db.matches, matchId, winnerId)
    } catch (e) {
      throw new ApiError((e as Error).message)
    }
  })

// TODO(미정): 대진 생성 방식 (자동 무작위 / 수동 배치 / 자동 생성 후 수정, 같은 도장 1회전 회피). APPROVED 신청만 포함
export const generateBrackets = (tournamentId: string): Promise<BracketDetail[]> =>
  run(() => {
    requireAdmin()
    find(db.tournaments, tournamentId, '대회')
    throw new ApiError('대진 생성 방식이 아직 정해지지 않았습니다.')
  })

export interface MyResult {
  tournament: Tournament
  brackets: BracketDetail[]
  rankings: Ranking[]
}

// 우리 도장 선수가 들어 있는 대진표만
export const getMyResults = () =>
  run((): MyResult[] => {
    const { dojang } = requireMaster()
    return db.tournaments
      .filter((t) => BRACKET_VISIBLE.includes(t.status))
      .sort((a, b) => b.eventDate.localeCompare(a.eventDate))
      .map((tournament) => {
        const brackets = bracketDetails(tournament.id).filter((d) =>
          Object.values(d.players).some((p) => p.dojangId === dojang.id),
        )
        return { tournament, brackets, rankings: tournament.status === 'FINISHED' ? toRankings(brackets) : [] }
      })
      .filter((r) => r.brackets.length > 0)
  })

// ---------- 어드민 ----------

export const getAdminSummary = () =>
  run(() => {
    requireAdmin()
    return {
      pendingMasters: db.users.filter((u) => u.role === 'MASTER' && u.status === 'PENDING').length,
      pendingApplications: db.applications.filter((a) => a.status === 'PENDING').length,
    }
  })

export const getMasters = () =>
  run((): MasterWithDojang[] => {
    requireAdmin()
    return db.users.filter((u) => u.role === 'MASTER').map(toMe)
  })

function masterUser(id: string): User {
  requireAdmin()
  const user = find(db.users, id, '관장')
  if (user.role !== 'MASTER') throw new ApiError('관장 계정이 아닙니다.')
  return user
}

export const approveMaster = (userId: string) => run(() => Object.assign(masterUser(userId), { status: 'APPROVED' }))

export const rejectMaster = (userId: string) => run(() => Object.assign(masterUser(userId), { status: 'REJECTED' }))

export interface MasterUpdateInput {
  name: string
  email: string
  phone: string
  dojang: DojangInput
}

export const updateMaster = (userId: string, input: MasterUpdateInput) =>
  run(() => {
    const user = masterUser(userId)
    const email = required(input.email, '이메일')
    if (db.users.some((u) => u.id !== userId && u.email.toLowerCase() === email.toLowerCase()))
      throw new ApiError('이미 사용 중인 이메일입니다.')
    const u = { name: required(input.name, '이름'), email, phone: required(input.phone, '연락처') }
    const d = {
      name: required(input.dojang.name, '도장명'),
      address: required(input.dojang.address, '도장 주소'),
      phone: required(input.dojang.phone, '도장 연락처'),
    }
    Object.assign(user, u)
    const dojang = db.dojangs.find((x) => x.ownerUserId === userId)
    if (dojang) Object.assign(dojang, d)
    return toMe(user)
  })
