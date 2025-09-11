import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { api, auth } from "./lib/auth";
import ProfileUploader from "./components/ProfileUploader";
import Avatar from "./components/Avatar";
import "./App.css";

type Me = { id: number; email: string; nickname: string };
type MeProfile = { id: number; email: string; nickname: string; profileImage?: string | null };

function getErrorMessage(err: unknown, fallback = "Request failed") {
    if (err instanceof Error) return err.message;
    if (typeof err === "string") return err;
    try { return JSON.stringify(err); } catch { return fallback; }
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

    useEffect(() => {
        (async () => {
            try {
                if (auth.get()) {
                    const data = await api<Me>("/api/auth/me");
                    setMe(data);
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
                method: "POST", body: JSON.stringify({ email, password, nickname }),
            });
            await handleLogin();
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
                method: "PUT", body: JSON.stringify({ nickname: newNick }),
            });
            setMe(data);
            setNewNick("");
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
        <div className="page">
            <header className="topbar">
                <div className="brand">Auth Demo</div>
                <div className="spacer" />
                {me ? (
                    <button className="btn ghost" onClick={handleLogout}>Logout</button>
                ) : null}
            </header>

            {!me ? (
                <div className="grid2">
                    <div className="card">
                        <div className="card-title">Login</div>
                        <form onSubmit={handleLogin} className="vstack">
                            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email" />
                            <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="password" type="password" />
                            <button className="btn" type="submit">Login</button>
                        </form>
                    </div>

                    <div className="card">
                        <div className="card-title">Register</div>
                        <form onSubmit={handleRegister} className="vstack">
                            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email" />
                            <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="password" type="password" />
                            <input value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="nickname" />
                            <button className="btn" type="submit">Register</button>
                        </form>
                        {error && <div className="error mt">{error}</div>}
                    </div>
                </div>
            ) : (
                <div className="grid2">
                    <div className="card">
                        <div className="card-title">Me</div>
                        <pre className="code">{JSON.stringify(me, null, 2)}</pre>
                    </div>

                    <div className="card">
                        <div className="card-title">Profile</div>

                        <div className="hstack gap">
                            <Avatar
                                src={profile?.profileImage ? `/upload/${profile.profileImage}` : undefined}
                                alt={me.nickname || me.email}
                                fallbackText={me.nickname || me.email}
                                size={140}
                            />

                            <div className="vstack">
                                <div className="muted">ID #{me.id}</div>
                                <div className="muted">{me.email}</div>
                                <div className="muted">Nickname: {me.nickname}</div>
                            </div>
                        </div>

                        <div className="divider" />

                        <ProfileUploader
                            onUpdated={async () => {
                                const prof = await api<MeProfile>("/api/me/profile");
                                setProfile(prof);
                            }}
                        />
                    </div>

                    <div className="card">
                        <div className="card-title">Update nickname</div>
                        <div className="vstack">
                            <input value={newNick} onChange={(e) => setNewNick(e.target.value)} placeholder="new nickname" />
                            <button className="btn" onClick={updateNickname} disabled={!newNick.trim()}>
                                Save
                            </button>
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-title">Change password</div>
                        <div className="vstack">
                            <input value={currPw} onChange={(e) => setCurrPw(e.target.value)} placeholder="current password" type="password" />
                            <input value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="new password (min 6)" type="password" />
                            <button className="btn" onClick={changePassword} disabled={!currPw.trim() || newPw.trim().length < 6}>
                                Change
                            </button>
                            {pwMsg && <div className="success">{pwMsg}</div>}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
