import type { ApplicationStatus, Division, Gender, TournamentStatus, UserStatus } from './types'

export const DIVISIONS: Division[] = ['ELEMENTARY', 'MIDDLE', 'HIGH']

export const DIVISION_LABEL: Record<Division, string> = {
  ELEMENTARY: '초등부',
  MIDDLE: '중등부',
  HIGH: '고등부',
}

export const GENDER_LABEL: Record<Gender, string> = { MALE: '남', FEMALE: '여' }

export const TOURNAMENT_STATUSES: TournamentStatus[] = [
  'UPCOMING',
  'OPEN',
  'CLOSED',
  'BRACKET_PUBLISHED',
  'IN_PROGRESS',
  'FINISHED',
]

export const TOURNAMENT_STATUS_LABEL: Record<TournamentStatus, string> = {
  UPCOMING: '접수 예정',
  OPEN: '접수중',
  CLOSED: '접수 마감',
  BRACKET_PUBLISHED: '대진표 공개',
  IN_PROGRESS: '경기 진행중',
  FINISHED: '대회 종료',
}

export const APPLICATION_STATUS_LABEL: Record<ApplicationStatus, string> = {
  PENDING: '승인 대기',
  APPROVED: '참가 확정',
  REJECTED: '반려',
}

export const USER_STATUS_LABEL: Record<UserStatus, string> = {
  PENDING: '승인 대기',
  APPROVED: '승인',
  REJECTED: '반려',
}

export const formatDate = (iso: string) => iso.slice(0, 10)
