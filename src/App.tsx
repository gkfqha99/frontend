import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { api, auth } from "./lib/auth";
import ProfileUploader from "./components/ProfileUploader";

type Me = { id: number; email: string; nickname: string };
type MeProfile = { id: number; email: string; nickname: string; profileImage?: string | null };

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
    const [profile, setProfile] = useState<MeProfile | null>(null);
    const [error, setError] = useState("");

    const [email, setEmail] = useState("a@test.com");
    const [password, setPassword] = useState("123456");
    const [nickname, setNickname] = useState("sul");
    const [newNick, setNewNick] = useState("");
    const [currPw, setCurrPw] = useState("");
    const [newPw, setNewPw] = useState("");
    const [pwMsg, setPwMsg] = useState("");

    // 앱 로드시 토큰 있으면 /me 확인
    useEffect(() => {
        (async () => {
            try {
                if (auth.get()) {
                    const data = await api<Me>("/api/auth/me");
                    setMe(data);
                    // 프로필(이미지 포함)도 병행 로드
                    const prof = await api<MeProfile>("/api/me/profile");
                    setProfile(prof);
                }
            } catch {
                auth.clear();
                setMe(null);
                setProfile(null);
            }
        })();
    }, []);

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

    const handleLogin = async (e?: FormEvent<HTMLFormElement>) => {
        e?.preventDefault();
        setError("");
        try {
            const { accessToken } = await api<{ accessToken: string }>(
                "/api/auth/login",
                { method: "POST", body: JSON.stringify({ email, password }) }
            );
            auth.set(accessToken);
            const data = await api<Me>("/api/auth/me");
            setMe(data);
            const prof = await api<MeProfile>("/api/me/profile");
            setProfile(prof);
        } catch (err: unknown) {
            setError(getErrorMessage(err, "Login failed"));
        }
    };

    const handleLogout = () => {
        auth.clear();
        setMe(null);
        setProfile(null);
    };

    const updateNickname = async () => {
        try {
            const data = await api<Me>("/api/auth/me/nickname", {
                method: "PUT",
                body: JSON.stringify({ nickname: newNick }),
            });
            setMe(data);
            setNewNick("");
            // 닉네임 변경 후 프로필도 갱신
            const prof = await api<MeProfile>("/api/me/profile");
            setProfile(prof);
        } catch (err) {
            alert(getErrorMessage(err, "Update nickname failed"));
        }
    };

    const changePassword = async () => {
        setPwMsg("");
        try {
            await api<void>("/api/auth/me/password", {
                method: "PUT",
                body: JSON.stringify({ currentPassword: currPw, newPassword: newPw }),
            });
            setPwMsg("비밀번호가 변경되었어요.");
            setCurrPw(""); setNewPw("");
        } catch (e: unknown) {
            setPwMsg(getErrorMessage(e, "Change password failed"));
        }
    };

    return (
        <div style={{ padding: 24, fontFamily: "Inter, system-ui, sans-serif" }}>
            <h2>Auth Demo</h2>

            {!me ? (
                <div style={{ display: "grid", gap: 16, maxWidth: 360 }}>
                    {/* 로그인 */}
                    <form onSubmit={handleLogin} style={{ display: "grid", gap: 8 }}>
                        <strong>Login</strong>
                        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email" />
                        <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="password" type="password" />
                        <button type="submit">Login</button>
                    </form>

                    {/* 회원가입 */}
                    <form onSubmit={handleRegister} style={{ display: "grid", gap: 8 }}>
                        <strong>Register</strong>
                        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email" />
                        <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="password" type="password" />
                        <input value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="nickname" />
                        <button type="submit">Register</button>
                    </form>

                    {error && <p style={{ color: "crimson" }}>{error}</p>}
                </div>
            ) : (
                <div style={{ display: "grid", gap: 16 }}>
                    <strong>Me</strong>
                    <pre style={{ padding: 12, background: "#111", color: "#eee", borderRadius: 8, maxWidth: 520 }}>
{JSON.stringify(me, null, 2)}
          </pre>

                    {/* 내 프로필(이미지 포함) */}
                    {profile && (
                        <div style={{ display: "grid", gap: 8, maxWidth: 520 }}>
                            <strong>Profile</strong>
                            {profile.profileImage ? (
                                <img
                                    src={`/upload/${profile.profileImage}`}
                                    alt="profile"
                                    style={{ maxWidth: "100%", borderRadius: 8, border: "1px solid #333" }}
                                />
                            ) : (
                                <em>프로필 이미지가 없습니다.</em>
                            )}
                        </div>
                    )}

                    {/* 프로필 업로더 */}
                    <ProfileUploader
                        onUpdated={async () => {
                            const prof = await api<MeProfile>("/api/me/profile");
                            setProfile(prof);
                        }}
                    />

                    {/* 닉네임 변경 */}
                    <div style={{ display: "grid", gap: 8, maxWidth: 360 }}>
                        <strong>Update nickname</strong>
                        <input value={newNick} onChange={(e) => setNewNick(e.target.value)} placeholder="new nickname" />
                        <button onClick={updateNickname} disabled={!newNick.trim()}>Save</button>
                    </div>

                    {/* 비밀번호 변경 */}
                    <div style={{ display: "grid", gap: 8, maxWidth: 360 }}>
                        <strong>Change password</strong>
                        <input value={currPw} onChange={(e) => setCurrPw(e.target.value)} placeholder="current password" type="password" />
                        <input value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="new password (min 6)" type="password" />
                        <button onClick={changePassword} disabled={!currPw.trim() || newPw.trim().length < 6}>Change</button>
                        {pwMsg && <small>{pwMsg}</small>}
                    </div>

                    <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => window.location.reload()}>Refresh</button>
                        <button onClick={handleLogout}>Logout</button>
                    </div>
                </div>
            )}
        </div>
    );
}
