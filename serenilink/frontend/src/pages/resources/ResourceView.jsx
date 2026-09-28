import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/axios";

function getYouTubeEmbedUrl(url) {
  if (!url) return null;
  try {
    const u = new URL(url);
    let videoId = null;
    if (u.hostname.includes("youtu.be")) {
      videoId = u.pathname.slice(1);
    } else if (u.hostname.includes("youtube.com")) {
      if (u.pathname.startsWith("/embed/")) {
        videoId = u.pathname.replace("/embed/", "");
      } else {
        videoId = u.searchParams.get("v");
      }
    }
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  } catch {
    return null;
  }
}

function ResourceView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get(`/content/${id}`)
      .then((r) => setItem(r.data))
      .catch(() => setError("Content not found."))
      .finally(() => setLoading(false));
  }, [id]);

  const cat = (item?.category || "").toLowerCase();
  const youtubeEmbed = getYouTubeEmbedUrl(item?.video_url);

  return (
    <div style={{ background: "var(--site-bg, #070808)", minHeight: "100vh", color: "var(--site-text, #fff)", transition: "background-color 0.25s ease, color 0.25s ease" }}>
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, height: "80px",
        padding: "0 48px", display: "flex", alignItems: "center",
        justifyContent: "space-between", zIndex: 10,
        borderBottom: "1px solid var(--border-faint, rgba(255,255,255,0.06))",
        background: "var(--site-bg, #070808)",
        transition: "background-color 0.25s ease",
      }}>
        <span style={{ fontSize: "22px", fontWeight: 700, color: "var(--site-muted, #B0B0B0)" }}>SereniLink</span>
        <button
          onClick={() => navigate(-1)}
          style={{ background: "transparent", border: "none", color: "var(--text-soft, #aeb4c1)", fontSize: "15px", fontWeight: 500, cursor: "pointer", padding: 0 }}
        >
          ← Back
        </button>
      </div>

      <div style={{ maxWidth: "820px", margin: "0 auto", padding: "48px 24px 80px", paddingTop: "112px" }}>
        {loading && <p style={{ color: "var(--text-muted, #888)", textAlign: "center" }}>Loading...</p>}
        {error && <p style={{ color: "var(--projection-danger, #f08f8f)", textAlign: "center" }}>{error}</p>}

        {item && (
          <>
            <span style={{
              display: "inline-block", padding: "4px 14px", borderRadius: "999px",
              background: "var(--accent-bg, rgba(184,147,129,0.15))", color: "var(--accent, #b89381)",
              fontSize: "0.85rem", fontWeight: 600, marginBottom: "18px",
              textTransform: "capitalize",
            }}>
              {item.category}
            </span>

            <h1 style={{ fontFamily: "Georgia, serif", fontSize: "2.4rem", fontWeight: 500, lineHeight: 1.3, marginBottom: "16px", color: "var(--site-text, #fff)" }}>
              {item.title}
            </h1>

            <p style={{ color: "var(--text-muted, #888)", fontSize: "0.9rem", marginBottom: "32px" }}>
              {new Date(item.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              {item.tags && ` · ${item.tags}`}
            </p>

            {/* Video embed */}
            {cat === "video" && youtubeEmbed && (
              <div style={{ marginBottom: "36px", overflow: "hidden", aspectRatio: "16/9" }}>
                <iframe
                  src={youtubeEmbed}
                  title={item.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{ width: "100%", height: "100%", border: "none" }}
                />
              </div>
            )}

            {cat === "video" && !youtubeEmbed && item.video_url && (
              <p style={{ color: "var(--projection-danger, #f08f8f)", marginBottom: "24px" }}>
                Could not embed video. <a href={item.video_url} target="_blank" rel="noreferrer" style={{ color: "var(--accent, #b89381)" }}>Open on YouTube</a>
              </p>
            )}

            {/* Audio player */}
            {cat === "audio" && item.video_url && (
              <div style={{ marginBottom: "36px", padding: "24px", background: "var(--bg-panel, rgba(255,255,255,0.03))", border: "1px solid var(--border-soft, rgba(255,255,255,0.08))", borderRadius: 12 }}>
                <audio controls style={{ width: "100%" }} src={item.video_url}>
                  Your browser does not support the audio element.
                </audio>
              </div>
            )}

            <div style={{ height: "1px", background: "var(--border-soft, rgba(255,255,255,0.07))", marginBottom: "36px" }} />

            <div style={{ color: "var(--text-soft, #d9d9d9)", fontSize: "1.05rem", lineHeight: 1.85, whiteSpace: "pre-wrap" }}>
              {item.body}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ResourceView;
