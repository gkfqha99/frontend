import { useEffect, useState } from "react";
import './App.css'

interface Todo {
    id: number;
    title: string;
    done: boolean;
}

export default function App() {
    const [todos, setTodos] = useState<Todo[]>([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string>("");

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch("/api/todos"); // → 프록시가 8080으로 전달
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data: Todo[] = await res.json();
                setTodos(data);
            } catch (e) {
                setErr(e instanceof Error ? e.message : String(e));
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    if (loading) return <div style={{ padding: 24 }}>로딩중…</div>;
    if (err) return <div style={{ padding: 24, color: "crimson" }}>에러: {err}</div>;

    return (
        <div style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
            <h1>할 일 목록</h1>
            <ul>
                {todos.map((t) => (
                    <li key={t.id}>
                        {t.title} {t.done ? "✅" : "⏳"}
                    </li>
                ))}
            </ul>
        </div>
    );
}
