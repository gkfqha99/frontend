import { useState } from "react";
import { api } from "../lib/auth";

type Props = {
    /** 업로드 성공 시 서버에서 반환한 이미지 URL(`/upload/...`)을 돌려줍니다. */
    onUpdated?: (profileUrl: string) => void;
};

export default function ProfileUploader({ onUpdated }: Props) {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const [lastUrl, setLastUrl] = useState("");

    function onPick(e: React.ChangeEvent<HTMLInputElement>) {
        const f = e.target.files?.[0] ?? null;
        setFile(f);
        if (f) {
            const reader = new FileReader();
            reader.onload = () => setPreview(String(reader.result));
            reader.readAsDataURL(f);
        } else {
            setPreview(null);
        }
    }

    async function onUpload() {
        if (!file) {
            window.alert("파일을 선택하세요.");
            return;
        }

        const fd = new FormData();
        fd.append("file", file);

        setBusy(true);
        try {
            // 백엔드: POST /api/me/profile-image (JWT 필요)
            const data = await api<{ filename: string; url: string }>(
                "/api/me/profile-image",
                { method: "POST", body: fd }
            );
            setLastUrl(data.url);
            onUpdated?.(data.url);
            window.alert("업로드 성공!");
        } catch (e: unknown) {
            const message =
                e instanceof Error ? e.message : "업로드 중 오류가 발생했습니다.";
            window.alert(message);
        } finally {
            setBusy(false);
        }
    }

    return (
        <div style={{ display: "grid", gap: 8, maxWidth: 520 }}>
            <strong>프로필 이미지 업로드</strong>

            <input type="file" accept="image/*" onChange={onPick} />

            {preview && (
                <img
                    src={preview}
                    alt="preview"
                    style={{ maxWidth: "100%", borderRadius: 8 }}
                />
            )}

            <button onClick={onUpload} disabled={busy || !file}>
                {busy ? "업로드 중..." : "업로드"}
            </button>

            {lastUrl && (
                <div>
                    <div>서버 URL:</div>
                    <code>{lastUrl}</code>
                    <div style={{ marginTop: 8 }}>
                        <img
                            src={lastUrl}
                            alt="uploaded"
                            style={{
                                maxWidth: "100%",
                                borderRadius: 8,
                                border: "1px solid #333",
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
