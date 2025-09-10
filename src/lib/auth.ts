/**
 * 인증/API 유틸리티 모듈 (FormData 업로드 대응)
 */

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

// ✅ 개선된 api(): FormData면 Content-Type 제거
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
    const token = auth.get();

    // 헤더 병합(기본은 JSON)
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(init?.headers as any),
    };

    // FormData면 Content-Type 제거 (브라우저가 자동 설정)
    const isFormData = init?.body instanceof FormData;
    if (isFormData) {
        delete headers["Content-Type"];
    }

    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(path, { ...init, headers });

    if (!res.ok) {
        let msg = "Request failed";
        try {
            const err = await res.json();
            msg = err.message || err.error || msg;
        } catch {}
        throw new Error(msg);
    }

    // 204 등 비어있는 응답 처리
    const text = await res.text();
    return text ? (JSON.parse(text) as T) : (undefined as T);
}
