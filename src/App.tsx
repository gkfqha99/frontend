/* 흐름도
1. 앱 시작 → 토큰 있으면 /me 확인 → 성공이면 로그인 상태

2. 회원가입 → 성공 후 자동 로그인

3. 로그인 → 토큰 저장 → /me 로 사용자 정보 렌더

4. 로그아웃 → 토큰 삭제 → 로그인 폼 보이기
*/

import { useEffect, useState } from "react";
import type { FormEvent } from "react"; // ★ type-only import
import { api, auth } from "./lib/auth";

type Me = { id: number; email: string; nickname: string };

// 에러 메시지 안전 추출 헬퍼 (any 금지)
function getErrorMessage(err: unknown, fallback = "Request failed") {
    if (err instanceof Error) return err.message;
    if (typeof err === "string") return err;
    try {
        return JSON.stringify(err);
    } catch {
        return fallback;
    }
}

export default function App() {
    const [me, setMe] = useState<Me | null>(null);
    const [error, setError] = useState("");

    // 폼 상태(샘플 값)
    const [email, setEmail] = useState("a@test.com");
    const [password, setPassword] = useState("123456");
    const [nickname, setNickname] = useState("sul");

    /*
    * me: 로그인 성공 시 사용자 정보, 없으면 null
      error: 화면에 띄울 에러 문자열
      email/password/nickname: 컨트롤드 인풋 값
    * */

    // 앱 로드시 토큰 있으면 /me 확인
    useEffect(() => {
        (async () => {
            try {
                if (auth.get()) {               // localStorage에 토큰 있는지
                    const data = await api<Me>("/api/auth/me"); // 자동으로 Bearer 붙음
                    setMe(data);                  // 로그인 상태로 전환
                }
            } catch {
                auth.clear();                   // 토큰이 깨졌으면 제거
                setMe(null);
            }
        })();
    }, []);
    /*
    마운트 1회 실행
    토큰 있으면 /me로 검증 → 성공 시 me 세팅
    실패(만료/위조)면 토큰 삭제
    주의: "/api/..." 처럼 상대경로를 쓰면 프론트 dev 서버(5173)에서 백엔드(8080)로 보내기 위해 Vite proxy 설정이 필요해.
        -> 보니까 이미 vite.config.ts에서 프록시 8080으로 설정해둬서 문제 없음
    */


    const handleRegister = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");
        try {
            await api<Me>("/api/auth/register", {
                method: "POST",
                body: JSON.stringify({ email, password, nickname }),
            });
            await handleLogin(); // 가입 성공 후 자동 로그인
        } catch (err: unknown) {
            setError(getErrorMessage(err, "Register failed"));
        }
    };
    /*
    기본 제출 막기(SPA 특성)
    api 호출(자동 JSON/에러 처리) → 성공 시 handleLogin 재사용
    실패 시 error 상태에 메시지
    * */

    const handleLogin = async (e?: FormEvent<HTMLFormElement>) => {
        e?.preventDefault();
        setError("");
        try {
            const { accessToken } = await api<{ accessToken: string }>(
                "/api/auth/login",
                { method: "POST", body: JSON.stringify({ email, password }) }
            );
            auth.set(accessToken);           // 토큰 저장(localStorage)
            const data = await api<Me>("/api/auth/me"); // 토큰으로 내 정보 조회
            setMe(data);
        } catch (err: unknown) {
            setError(getErrorMessage(err, "Login failed"));
        }
    };
    /*
    로그인 성공 → 응답에서 accessToken 꺼내 저장
    이어서 /me로 유저 정보 받아서 화면 상태 전환
    */

    const handleLogout = () => {
        auth.clear();   // 토큰 삭제
        setMe(null);    // 비로그인 상태로 전환
    };


    return (
        <div style={{ padding: 24, fontFamily: "Inter, system-ui, sans-serif" }}>
            <h2>Auth Demo</h2>

            {!me ? (  // 로그인 전
                <div style={{ display: "grid", gap: 16, maxWidth: 360 }}>
                    {/* 로그인 폼 */}
                    <form onSubmit={handleLogin} style={{ display: "grid", gap: 8 }}>
                        <strong>Login</strong>
                        <input
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="email"
                        />
                        <input
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="password"
                            type="password"
                        />
                        <button type="submit">Login</button>
                    </form>
                    {/* 회원가입 폼 */}
                    <form onSubmit={handleRegister} style={{ display: "grid", gap: 8 }}>
                        <strong>Register</strong>
                        <input
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="email"
                        />
                        <input
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="password"
                            type="password"
                        />
                        <input
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                            placeholder="nickname"
                        />
                        <button type="submit">Register</button>
                    </form>
                    {/* 에러 메시지 */}
                    {error && <p style={{ color: "crimson" }}>{error}</p>}
                </div>
            ) : (
                <div style={{ display: "grid", gap: 12 }}>
                    <strong>Me</strong>
                    <pre
                        style={{
                            padding: 12,
                            background: "#111",
                            color: "#eee",
                            borderRadius: 8,
                            maxWidth: 520,
                        }}
                    >
            {JSON.stringify(me, null, 2)}
          </pre>
                    <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => window.location.reload()}>Refresh</button>
                        <button onClick={handleLogout}>Logout</button>
                    </div>
                </div>
            )}
        </div>
    );
    /*
    me 유무로 화면 분기
    폼 onSubmit 은 위 핸들러에 연결
    로그인 후엔 /me 객체를 그대로 보여주고, Logout 버튼 제공
    Refresh 는 단순 새로고침 → useEffect 재실행으로 토큰 재검증
    */
}
