type Props = {
    src?: string | null;
    alt?: string;
    size?: number; // px
    fallbackText?: string; // 닉네임/이메일 앞글자 등
};

export default function Avatar({ src, alt = "profile", size = 120, fallbackText }: Props) {
    const letter =
        (fallbackText?.trim()?.[0] ?? alt?.trim()?.[0] ?? "?").toUpperCase();

    if (!src) {
        return (
            <div
                className="avatar"
                style={{ width: size, height: size, fontSize: size * 0.4 }}
                aria-label="avatar-fallback"
                title={fallbackText || alt}
            >
                {letter}
            </div>
        );
    }

    return (
        <img
            className="avatar"
            src={src}
            alt={alt}
            style={{ width: size, height: size }}
        />
    );
}
