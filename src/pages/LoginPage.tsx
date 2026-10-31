import { useState, type FormEvent } from 'react'
import { ApiError, login } from '../api/httpApi'

type Props = {
  baseUrl: string
  onLogin: (token: string) => void
}

export default function LoginPage({ baseUrl, onLogin }: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      onLogin(await login(baseUrl, email, password))
    } catch (failure) {
      const wrongCredentials = failure instanceof ApiError && failure.status === 401
      setError(wrongCredentials ? '이메일 또는 비밀번호가 올바르지 않습니다.' : '서버에 연결할 수 없습니다.')
      setSubmitting(false)
    }
  }

  return (
    <div className="app">
      <main className="login">
        <form className="card login__form" onSubmit={submit}>
          <span className="logo">#Keeper</span>
          <h1>점주 로그인</h1>
          <label htmlFor="login-email">
            이메일
            <input
              id="login-email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <label htmlFor="login-password">
            비밀번호
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          {error && (
            <p className="field-error" role="alert">
              {error}
            </p>
          )}
          <button type="submit" className="confirm-button login__submit" disabled={submitting}>
            로그인
          </button>
        </form>
      </main>
    </div>
  )
}
