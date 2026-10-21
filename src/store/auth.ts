import { create } from 'zustand'
import * as api from '../api'
import type { Me } from '../types'

interface AuthState {
  me: Me | null
  ready: boolean
  load: () => Promise<void>
  login: (email: string) => Promise<Me>
  signup: (input: api.SignupInput) => Promise<Me>
  logout: () => Promise<void>
}

// 로그인 유지는 api 세션(localStorage)이 담당. 스토어는 화면용 캐시
export const useAuth = create<AuthState>((set) => ({
  me: null,
  ready: false,
  load: async () => set({ me: await api.getMe(), ready: true }),
  login: async (email) => {
    const me = await api.login(email)
    set({ me })
    return me
  },
  signup: async (input) => {
    const me = await api.signup(input)
    set({ me })
    return me
  },
  logout: async () => {
    await api.logout()
    set({ me: null })
  },
}))
