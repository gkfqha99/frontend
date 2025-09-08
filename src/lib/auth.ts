/**
 * 인증/API 유틸리티 모듈
 *
 * 1) auth 객체
 *    - 브라우저 localStorage 에 JWT accessToken 저장/조회/삭제
 *    - 로그인 시 token 저장, 로그아웃 시 제거 등에 사용
 *
 * 2) api<T>(path, init)
 *    - fetch() 를 감싼 공통 API 클라이언트
 *    - 자동으로 Authorization 헤더(Bearer 토큰) 붙여줌
 *    - 응답이 실패하면(JSON 에러 응답 기준) 에러 메시지 통일 처리
 *    - 응답이 성공이면 JSON 파싱해서 T 타입으로 반환
 *    - 204 No Content 같은 경우는 undefined 반환
 *
 * 사용 예시:
 *    const token = await api<TokenRes>("/api/auth/login", { method: "POST", body: ... });
 *    const me = await api<MeRes>("/api/auth/me");
 */


// 토큰 보관/조회/삭제
const KEY = "accessToken";

export const auth = {
    get() {
        return localStorage.getItem(KEY);
    },
    set(token: string) {
        localStorage.setItem(KEY, token);
    },
    clear() {
        localStorage.removeItem(KEY);
    },
};

// 인증이 필요한 요청용 fetch 래퍼
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
    const token = auth.get();
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(init?.headers as any),
    };
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(path, { ...init, headers });
    if (!res.ok) {
        // 에러 메시지(GlobalExceptionHandler로 통일된 JSON 가정)
        let msg = "Request failed";
        try {
            const err = await res.json();
            msg = err.message || err.error || msg;
        } catch {}
        throw new Error(msg);
    }
    // 204 같은 빈 응답 고려
    const text = await res.text();
    return text ? (JSON.parse(text) as T) : (undefined as T);
}

/*
* 지금까지 우리가 만든 demo 프로젝트는 백엔드(Spring Boot) → DB 연결, JWT 발급/검증
frontend 프로젝트는 프론트엔드(React/Vite/TypeScript) → 화면, 로그인/회원가입 폼, API 호출

📌 그래서:
src/lib/auth.ts → 프론트에서 토큰 저장/조회/삭제 + **fetch 래퍼(api 함수)**를 담아두는 공통 모듈
컴포넌트(예: Login.tsx, Register.tsx) 에서는 이 auth.ts 불러다 쓰는 구조

👉 정리하면:
백엔드: 로그인 시 JWT(제이슨 웹 토큰) 발급
프론트엔드: src/lib/auth.ts 에서 토큰을 localStorage 에 저장하고, API 요청할 때 자동으로 붙여주는 코드
*
* 근데 왜 이 파일은 ts 냐면
.ts → 순수 코드 / 로직 (컴포넌트 X)
.tsx → React 컴포넌트 (UI = JSX 문법 포함 가능)
* */