import { useCallback, useEffect, useState } from 'react'

// api 함수 호출 결과를 화면 상태로. reload()로 다시 불러옴
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[]) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const load = useCallback(fn, deps)

  const reload = useCallback(async () => {
    setLoading(true)
    try {
      setData(await load())
      setError(null)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [load])

  useEffect(() => {
    reload()
  }, [reload])

  return { data, error, loading, reload }
}

// 버튼 동작 등 일회성 api 호출. 실패 메시지를 alert로 보여줌
export async function act(fn: () => Promise<unknown>, after?: () => unknown) {
  try {
    await fn()
    await after?.()
  } catch (e) {
    alert((e as Error).message)
  }
}
