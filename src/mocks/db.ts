import { createSeed, type Db } from './seed'

const DB_KEY = 'gjha.mockDb'
const SESSION_KEY = 'gjha.session'

function load(): Db {
  try {
    const raw = localStorage.getItem(DB_KEY)
    if (raw) return JSON.parse(raw) as Db
  } catch {
    // 저장소를 못 쓰거나 손상되면 시드로 시작
  }
  return createSeed()
}

export const db: Db = load()

export function saveDb() {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(db))
  } catch {
    // 저장 실패 시 메모리 상태로만 유지
  }
}

export function resetDb() {
  try {
    localStorage.removeItem(DB_KEY)
    localStorage.removeItem(SESSION_KEY)
  } catch {
    // 무시
  }
}

// 로그인 상태(현재 사용자 id). 실제 서버의 토큰 역할
export function getSessionUserId(): string | null {
  try {
    return localStorage.getItem(SESSION_KEY)
  } catch {
    return null
  }
}

export function setSessionUserId(id: string | null) {
  try {
    if (id) localStorage.setItem(SESSION_KEY, id)
    else localStorage.removeItem(SESSION_KEY)
  } catch {
    // 무시
  }
}
