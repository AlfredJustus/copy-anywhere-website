import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#faf7f2",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Logo icon */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 120,
            height: 120,
            borderRadius: 28,
            background: "#ffffff",
            boxShadow: "0 8px 32px rgba(35,25,18,0.08)",
            marginBottom: 40,
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 128 128"
            width="80"
            height="80"
          >
            <path
              fill="#D4734A"
              d="M79.5 28h-32c-4.4 0-8 3.6-8 8v37.5h8V36h32V28Zm12.5 13.5h-32c-4.4 0-8 3.6-8 8v42.5c0 4.4 3.6 8 8 8h32c4.4 0 8-3.6 8-8V49.5c0-4.4-3.6-8-8-8Zm0 50.5h-32V49.5h32V92Z"
            />
          </svg>
        </div>

        {/* Title */}
        <div
          style={{
            display: "flex",
            fontSize: 56,
            fontWeight: 700,
            color: "#231912",
            letterSpacing: "-1px",
          }}
        >
          Copy Anywhere
        </div>

        {/* Tagline */}
        <div
          style={{
            display: "flex",
            fontSize: 24,
            color: "#726962",
            marginTop: 16,
            maxWidth: 700,
            textAlign: "center",
          }}
        >
          Perfect formatting, everywhere you paste
        </div>

        {/* Format pills */}
        <div
          style={{
            display: "flex",
            gap: 16,
            marginTop: 40,
          }}
        >
          {["Notion", "Markdown", "Google Docs"].map((label) => (
            <div
              key={label}
              style={{
                display: "flex",
                padding: "10px 24px",
                borderRadius: 999,
                background: "rgba(212,115,74,0.1)",
                color: "#d4734a",
                fontSize: 20,
                fontWeight: 600,
              }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
