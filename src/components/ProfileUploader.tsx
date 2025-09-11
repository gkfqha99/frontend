import { useCallback, useState } from "react";
import { api } from "../lib/auth";

const MAX_MB = 5;
const MAX_BYTES = MAX_MB * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

type Props = {
    onUpdated?: (profileUrl: string) => void;
};

export default function ProfileUploader({ onUpdated }: Props) {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    const readPreview = (f: File) => {
        const reader = new FileReader();
        reader.onload = () => setPreview(String(reader.result));
        reader.readAsDataURL(f);
    };

    const validateAndSet = (f: File) => {
        if (!ALLOWED.includes(f.type)) {
            setError("JPG/PNG/WebP 파일만 업로드할 수 있어요.");
            return;
        }
        if (f.size > MAX_BYTES) {
            setError(`파일 용량이 너무 커요. 최대 ${MAX_MB}MB`);
            return;
        }
        setError("");
        setFile(f);
        readPreview(f);
    };

    const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (f) validateAndSet(f);
    };

    const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const f = e.dataTransfer.files?.[0];
        if (f) validateAndSet(f);
    }, []);

    const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    const onClear = () => {
        setFile(null);
        setPreview(null);
        setError("");
    };

    const onUpload = async () => {
        if (!file) {
            window.alert("파일을 선택하세요.");
            return;
        }
        setBusy(true);
        try {
            const fd = new FormData();
            fd.append("file", file);
            const data = await api<{ filename: string; url: string }>(
                "/api/me/profile-image",
                { method: "POST", body: fd }
            );
            onUpdated?.(data.url);
            window.alert("업로드 성공!");
            onClear();
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : "업로드 실패";
            setError(msg);
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="card">
            <div className="card-title">프로필 이미지 업로드</div>

            <div
                className={`dropzone ${preview ? "has-preview" : ""}`}
                onDrop={onDrop}
                onDragOver={onDragOver}
            >
                {preview ? (
                    <img src={preview} alt="preview" className="preview" />
                ) : (
                    <div className="dropzone-hint">
                        <div>여기로 드래그하거나</div>
                        <div><span className="badge">파일 선택</span> 버튼을 누르세요</div>
                        <small>허용: JPG / PNG / WebP · 최대 {MAX_MB}MB</small>
                    </div>
                )}
            </div>

            <div className="row">
                <label className="btn ghost">
                    파일 선택
                    <input type="file" accept="image/*" onChange={onPick} hidden />
                </label>
                <button className="btn" onClick={onUpload} disabled={busy || !file}>
                    {busy ? "업로드 중..." : "업로드"}
                </button>
                {file && (
                    <button className="btn danger" onClick={onClear} disabled={busy}>
                        취소
                    </button>
                )}
            </div>

            {error && <div className="error">{error}</div>}
        </div>
    );
}
