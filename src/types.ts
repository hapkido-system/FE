export type Role = 'MASTER' | 'ADMIN'
export type UserStatus = 'PENDING' | 'APPROVED' | 'REJECTED'
export type Gender = 'MALE' | 'FEMALE'
export type Division = 'ELEMENTARY' | 'MIDDLE' | 'HIGH'
export type TournamentStatus = 'UPCOMING' | 'OPEN' | 'CLOSED' | 'BRACKET_PUBLISHED' | 'IN_PROGRESS' | 'FINISHED'
export type ApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export interface User {
  id: string
  email: string
  name: string
  phone: string
  role: Role
  status: UserStatus // MASTER에만 의미 있음
  createdAt: string
}

export interface Dojang {
  id: string
  ownerUserId: string
  name: string
  address: string
  phone: string
}

export interface Student {
  id: string
  dojangId: string
  name: string
  gender: Gender
  division: Division
}

export interface Tournament {
  id: string
  title: string
  description: string
  location: string
  eventDate: string
  applyStartAt: string
  applyEndAt: string
  status: TournamentStatus
  createdAt: string
}

export interface Application {
  id: string
  tournamentId: string
  dojangId: string
  studentId: string | null // 직접 입력한 경우 null
  playerName: string
  gender: Gender
  division: Division
  status: ApplicationStatus
  rejectReason: string | null
  createdAt: string
}

export interface Bracket {
  id: string
  tournamentId: string
  division: Division
  gender: Gender | null // TODO(미정): 대진 단위. 지금은 null
}

export interface Match {
  id: string
  bracketId: string
  round: number
  position: number
  player1Id: string | null
  player2Id: string | null
  winnerId: string | null
  nextMatchId: string | null
  nextSlot: 1 | 2 | null
}

export interface Notice {
  id: string
  title: string
  content: string
  authorId: string
  createdAt: string
}

// API 응답용 조합 타입
export interface Me {
  user: User
  dojang: Dojang | null
}

export interface PlayerInfo {
  name: string
  dojangId: string
  dojangName: string
}

export interface BracketDetail {
  bracket: Bracket
  matches: Match[]
  players: Record<string, PlayerInfo> // key: Application id
}

export interface Ranking {
  division: Division
  first: PlayerInfo | null
  second: PlayerInfo | null
}

export interface ApplicationWithDojang extends Application {
  dojangName: string
}

export interface MasterWithDojang {
  user: User
  dojang: Dojang | null
}

export type PlayerInput =
  | { studentId: string }
  | { playerName: string; gender: Gender; division: Division }
