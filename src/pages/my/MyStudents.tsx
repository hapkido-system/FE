import { useState, type FormEvent } from 'react'
import * as api from '../../api'
import { Async, Card, Empty, ErrorText, PageTitle, Table, btn, inputBase, td } from '../../components/ui'
import { DatePicker, todayStr } from '../../components/DatePicker'
import { Select } from '../../components/Select'
import { DIVISIONS, DIVISION_LABEL, GENDER_LABEL } from '../../labels'
import type { Division, Gender, Student } from '../../types'
import { act, useAsync } from '../../useAsync'

const EMPTY: api.StudentInput = { name: '', birthDate: '', gender: '' as Gender, division: '' as Division }

function StudentForm({ initial, onSave, onCancel }: { initial: api.StudentInput; onSave: (v: api.StudentInput) => Promise<unknown>; onCancel?: () => void }) {
  const [form, setForm] = useState(initial)
  const [error, setError] = useState('')

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await onSave(form)
      setForm(initial)
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
          value={form.birthDate}
          onChange={(v) => setForm({ ...form, birthDate: v })}
          className="w-40"
        />
        <Select
          aria-label="성별"
          placeholder="성별"
          required
          value={form.gender}
          onChange={(v) => setForm({ ...form, gender: v as Gender })}
          options={(['MALE', 'FEMALE'] as Gender[]).map((g) => ({ value: g, label: GENDER_LABEL[g] }))}
          className="w-28"
        />
        <Select
          aria-label="부별"
          placeholder="부별"
          required
          value={form.division}
          onChange={(v) => setForm({ ...form, division: v as Division })}
          options={DIVISIONS.map((d) => ({ value: d, label: DIVISION_LABEL[d] }))}
          className="w-32"
        />
        <button className={btn.primary}>{onCancel ? '저장' : '등록'}</button>
        {onCancel && <button type="button" onClick={onCancel} className={btn.secondary}>취소</button>}
      </div>
      <ErrorText>{error}</ErrorText>
    </form>
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
        <StudentForm initial={EMPTY} onSave={async (v) => { await api.createStudent(v); await students.reload() }} />
      </Card>
      <Card>
        <Async state={students}>
          {(list) =>
            list.length === 0 ? (
              <Empty>등록된 학생이 없습니다.</Empty>
            ) : (
              <Table head={['이름', '생년월일', '성별', '부별', '']}>
                {list.map((s) =>
                  editing === s.id ? (
                    <tr key={s.id}>
                      <td className={td} colSpan={5}>
                        <StudentForm
                          initial={{ name: s.name, birthDate: s.birthDate ?? '', gender: s.gender, division: s.division }}
                          onSave={async (v) => { await api.updateStudent(s.id, v); setEditing(null); await students.reload() }}
                          onCancel={() => setEditing(null)}
                        />
                      </td>
                    </tr>
                  ) : (
                    <tr key={s.id}>
                      <td className={`${td} font-medium`}>{s.name}</td>
                      {/* 생년월일 추가 전에 저장된 mock 데이터에는 값이 없을 수 있음 */}
                      <td className={td}>{s.birthDate ?? '-'}</td>
                      <td className={td}>{GENDER_LABEL[s.gender]}</td>
                      <td className={td}>{DIVISION_LABEL[s.division]}</td>
                      <td className={`${td} text-right`}>
                        <div className="flex justify-end gap-2">
                          <button onClick={() => setEditing(s.id)} className={btn.small}>수정</button>
                          <button onClick={() => onDelete(s)} className={btn.danger}>삭제</button>
                        </div>
                      </td>
                    </tr>
                  ),
                )}
              </Table>
            )
          }
        </Async>
      </Card>
    </>
  )
}
