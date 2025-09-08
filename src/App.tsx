import { useState } from "react";

export default function App() {
    const [email, setEmail] = useState("a@test.com");
    const [password, setPassword] = useState("123456");
    const [me, setMe] = useState<any>(null);
    const [err, setErr] = useState("");

    const login = async () => {
        try {
            setErr("");
            const r = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });
            if (!r.ok) throw new Error(await r.text());
            const { accessToken } = await r.json();

            const m = await fetch("/api/auth/me", {
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            setMe(await m.json());
        } catch (e: any) {
            setErr(e.message || "login failed");
        }
    };

    return (
        <div style={{ padding: 24 }}>
            <h2>Login Test</h2>
            <input value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="email" />
            <input value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="password" type="password" />
            <button onClick={login}>Login</button>
            {err && <p style={{ color: "red" }}>{err}</p>}
            {me && <pre>{JSON.stringify(me, null, 2)}</pre>}
        </div>
    );
}
