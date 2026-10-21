import { useState, type FormEvent } from 'react'
import * as api from '../../api'
import { Async, Card, Empty, ErrorText, PageTitle, Table, btn, inputBase, inputCls } from '../../components/ui'
import { DatePicker, todayStr } from '../../components/DatePicker'
import { Select } from '../../components/Select'
import { DIVISIONS, DIVISION_LABEL, GENDER_LABEL } from '../../labels'
import type { Division, Gender, Student } from '../../types'
import { act, useAsync } from '../../useAsync'

const EMPTY: api.StudentInput = { name: '', birthDate: '', gender: '' as Gender, division: '' as Division }
const GENDER_OPTIONS = (['MALE', 'FEMALE'] as Gender[]).map((g) => ({ value: g, label: GENDER_LABEL[g] }))
const DIVISION_OPTIONS = DIVISIONS.map((d) => ({ value: d, label: DIVISION_LABEL[d] }))

function StudentForm({ onSave }: { onSave: (v: api.StudentInput) => Promise<unknown> }) {
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState('')

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await onSave(form)
      setForm(EMPTY)
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <input aria-label="이름" placeholder="이름" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={`${inputBase} w-36`} />
        <DatePicker
          aria-label="생년월일"
          placeholder="생년월일"
          required
          max={todayStr()}
          startMode="year"
          value={form.birthDate}
          onChange={(v) => setForm({ ...form, birthDate: v })}
          className="w-40"
        />
        <Select aria-label="성별" placeholder="성별" required value={form.gender} onChange={(v) => setForm({ ...form, gender: v as Gender })} options={GENDER_OPTIONS} className="w-28" />
        <Select aria-label="부별" placeholder="부별" required value={form.division} onChange={(v) => setForm({ ...form, division: v as Division })} options={DIVISION_OPTIONS} className="w-32" />
        <button className={btn.primary}>등록</button>
      </div>
      <ErrorText>{error}</ErrorText>
    </form>
  )
}

// 보기·수정 상태에서 칸 위치와 크기가 같도록 보기 상태 값도 입력칸과 같은 상자(테두리만 투명)에 넣음
const viewBox = 'block truncate rounded-lg border border-transparent px-3 py-2 text-sm'
const cell = 'py-1.5 pr-2 align-middle'
const COLS = ['w-40', 'w-44', 'w-28', 'w-32'] // 이름, 생년월일, 성별, 부별

function StudentRow({ s, editing, onEdit, onDone, onDelete }: { s: Student; editing: boolean; onEdit: () => void; onDone: (saved: boolean) => void; onDelete: () => void }) {
  // 생년월일 추가 전에 저장된 mock 데이터에는 값이 없을 수 있음
  const [form, setForm] = useState<api.StudentInput>({ name: s.name, birthDate: s.birthDate ?? '', gender: s.gender, division: s.division })
  const [error, setError] = useState('')

  const onSave = async () => {
    setError('')
    try {
      await api.updateStudent(s.id, form)
      onDone(true)
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <>
      <tr>
        {editing ? (
          <>
            <td className={`${cell} ${COLS[0]}`}>
              <input aria-label="이름" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} />
            </td>
            <td className={`${cell} ${COLS[1]}`}>
              <DatePicker aria-label="생년월일" max={todayStr()} value={form.birthDate} onChange={(v) => setForm({ ...form, birthDate: v })} />
            </td>
            <td className={`${cell} ${COLS[2]}`}>
              <Select aria-label="성별" value={form.gender} onChange={(v) => setForm({ ...form, gender: v as Gender })} options={GENDER_OPTIONS} />
            </td>
            <td className={`${cell} ${COLS[3]}`}>
              <Select aria-label="부별" value={form.division} onChange={(v) => setForm({ ...form, division: v as Division })} options={DIVISION_OPTIONS} />
            </td>
          </>
        ) : (
          <>
            <td className={`${cell} ${COLS[0]}`}><span className={`${viewBox} font-medium`}>{s.name}</span></td>
            <td className={`${cell} ${COLS[1]}`}><span className={viewBox}>{s.birthDate ?? '-'}</span></td>
            <td className={`${cell} ${COLS[2]}`}><span className={viewBox}>{GENDER_LABEL[s.gender]}</span></td>
            <td className={`${cell} ${COLS[3]}`}><span className={viewBox}>{DIVISION_LABEL[s.division]}</span></td>
          </>
        )}
        <td className={`${cell} pl-2 pr-3 text-right`}>
          <div className="flex justify-end gap-2">
            {editing ? (
              <>
                <button onClick={onSave} className={btn.smallPrimary}>저장</button>
                <button onClick={() => onDone(false)} className={btn.small}>취소</button>
              </>
            ) : (
              <>
                <button onClick={onEdit} className={btn.small}>수정</button>
                <button onClick={onDelete} className={btn.danger}>삭제</button>
              </>
            )}
          </div>
        </td>
      </tr>
      {error && (
        <tr>
          <td colSpan={5} className="pb-2 pr-3">
            <ErrorText>{error}</ErrorText>
          </td>
        </tr>
      )}
    </>
  )
}

export default function MyStudents() {
  const students = useAsync(api.getMyStudents, [])
  const [editing, setEditing] = useState<string | null>(null)

  const onDelete = (s: Student) => {
    if (confirm(`${s.name} 학생을 삭제할까요? (기존 신청 기록은 유지됩니다)`)) act(() => api.deleteStudent(s.id), students.reload)
  }

  return (
    <>
      <PageTitle>학생 관리</PageTitle>
      <Card className="mb-6">
        <h2 className="mb-3 font-semibold">학생 등록</h2>
        <StudentForm onSave={async (v) => { await api.createStudent(v); await students.reload() }} />
      </Card>
      <Card>
        <Async state={students}>
          {(list) =>
            list.length === 0 ? (
              <Empty>등록된 학생이 없습니다.</Empty>
            ) : (
              <Table head={['이름', '생년월일', '성별', '부별', '']}>
                {list.map((s) => (
                  <StudentRow
                    // 수정 시작·종료 때마다 다시 마운트해 입력값을 현재 학생 정보로 초기화
                    key={`${s.id}-${editing === s.id}`}
                    s={s}
                    editing={editing === s.id}
                    onEdit={() => setEditing(s.id)}
                    onDone={async (saved) => {
                      // 저장 후에는 새 값을 받아온 뒤 보기 상태로 전환 (이전 값이 잠깐 보이지 않도록)
                      if (saved) await students.reload()
                      setEditing(null)
                    }}
                    onDelete={() => onDelete(s)}
                  />
                ))}
              </Table>
            )
          }
        </Async>
      </Card>
    </>
  )
}
