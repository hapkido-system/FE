import { useState, type FormEvent } from 'react'
import { DIVISIONS, DIVISION_LABEL, GENDER_LABEL } from '../labels'
import type { Division, Gender, PlayerInput, Student } from '../types'
import { ErrorText, Field, btn, inputCls } from './ui'

interface Props {
  students: Student[]
  appliedStudentIds: Set<string> // 이미 신청한 학생 (중복 신청 방지 안내용)
  initial?: { studentId: string | null; playerName: string; gender: Gender; division: Division }
  submitLabel: string
  onSubmit: (input: PlayerInput) => Promise<void>
  onCancel?: () => void
}

export function PlayerForm({ students, appliedStudentIds, initial, submitLabel, onSubmit, onCancel }: Props) {
  const [mode, setMode] = useState<'student' | 'direct'>(initial && !initial.studentId ? 'direct' : 'student')
  const [studentId, setStudentId] = useState(initial?.studentId ?? '')
  const [playerName, setPlayerName] = useState(initial?.studentId ? '' : initial?.playerName ?? '')
  const [gender, setGender] = useState<Gender | ''>(initial?.studentId ? '' : initial?.gender ?? '')
  const [division, setDivision] = useState<Division | ''>(initial?.studentId ? '' : initial?.division ?? '')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const selected = students.find((s) => s.id === studentId)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (mode === 'student' && !studentId) return setError('학생을 선택해 주세요.')
    if (mode === 'direct' && (!gender || !division)) return setError('성별과 부별을 선택해 주세요.')
    setBusy(true)
    try {
      await onSubmit(mode === 'student' ? { studentId } : { playerName, gender: gender as Gender, division: division as Division })
      setStudentId('')
      setPlayerName('')
      setGender('')
      setDivision('')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const tab = (m: typeof mode, label: string) => (
    <button
      type="button"
      onClick={() => setMode(m)}
      className={`flex-1 rounded-md px-3 py-2 text-sm font-medium ${mode === m ? 'bg-white text-brand shadow-sm' : 'text-slate-500'}`}
    >
      {label}
    </button>
  )

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
        {tab('student', '학생 목록에서 선택')}
        {tab('direct', '직접 입력')}
      </div>

      {mode === 'student' ? (
        <>
          <Field label="학생">
            <select value={studentId} onChange={(e) => setStudentId(e.target.value)} className={inputCls}>
              <option value="">선택하세요</option>
              {students.map((s) => {
                const applied = appliedStudentIds.has(s.id) && s.id !== initial?.studentId
                return (
                  <option key={s.id} value={s.id} disabled={applied}>
                    {s.name} ({GENDER_LABEL[s.gender]} · {DIVISION_LABEL[s.division]}){applied ? ' - 신청됨' : ''}
                  </option>
                )
              })}
            </select>
          </Field>
          {students.length === 0 && <p className="text-sm text-slate-500">등록된 학생이 없습니다. 학생 관리에서 먼저 등록하거나 직접 입력해 주세요.</p>}
          {selected && (
            <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
              이름 <b>{selected.name}</b> · 성별 <b>{GENDER_LABEL[selected.gender]}</b> · 부별 <b>{DIVISION_LABEL[selected.division]}</b>
            </p>
          )}
        </>
      ) : (
        <>
          <Field label="이름">
            <input value={playerName} onChange={(e) => setPlayerName(e.target.value)} className={inputCls} required />
          </Field>
          <fieldset>
            <legend className="mb-1 text-sm font-medium text-slate-700">성별</legend>
            <div className="flex gap-4">
              {(['MALE', 'FEMALE'] as Gender[]).map((g) => (
                <label key={g} className="flex items-center gap-1.5 text-sm">
                  <input type="radio" name="gender" checked={gender === g} onChange={() => setGender(g)} />
                  {GENDER_LABEL[g]}
                </label>
              ))}
            </div>
          </fieldset>
          <Field label="부별">
            <select value={division} onChange={(e) => setDivision(e.target.value as Division)} className={inputCls}>
              <option value="">선택하세요</option>
              {DIVISIONS.map((d) => <option key={d} value={d}>{DIVISION_LABEL[d]}</option>)}
            </select>
          </Field>
        </>
      )}

      <ErrorText>{error}</ErrorText>
      <div className="flex gap-2">
        <button disabled={busy} className={btn.primary}>{submitLabel}</button>
        {onCancel && <button type="button" onClick={onCancel} className={btn.secondary}>취소</button>}
      </div>
    </form>
  )
}
