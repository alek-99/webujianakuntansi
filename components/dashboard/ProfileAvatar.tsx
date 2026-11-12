
"use client";

import { useEffect, useState } from "react";

interface ProfileAvatarProps {
  size?: number;
}

export default function ProfileAvatar({
  size = 42,
}: ProfileAvatarProps) {
  const [avatar, setAvatar] = useState<string | null>(null);
  const [nama, setNama] = useState("User");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function fetchAvatar() {
      try {
        const response = await fetch("/api/profile", {
          cache: "no-store",
        });

        if (!response.ok) return;

        const result = await response.json();

        if (!mounted) return;

        setAvatar(result.profile?.avatar_url ?? null);
        setNama(result.profile?.nama ?? "User");
      } catch (error) {
        console.error("Gagal memuat avatar:", error);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchAvatar();

    return () => {
      mounted = false;
    };
  }, []);

  const initials = nama
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  return (
    <div
      className="
        group relative flex shrink-0 items-center
        justify-center overflow-hidden rounded-full
        border border-gray-200/80
        bg-gradient-to-br from-gray-50 to-gray-100
        text-sm font-semibold text-gray-600
        shadow-sm
        transition-all duration-300 ease-out
        hover:scale-105 hover:shadow-md
      "
      style={{
        width: size,
        height: size,
      }}
      title={nama}
    >
      {loading ? (
        <div className="h-full w-full animate-pulse rounded-full bg-gray-200" />
      ) : avatar ? (
        <img
          src={avatar}
          alt={`Avatar ${nama}`}
          className="
            h-full w-full object-cover
            transition-transform duration-500
            group-hover:scale-110
          "
        />
      ) : (
        <span className="select-none tracking-wide">
          {initials || "U"}
        </span>
      )}

      {/* Subtle border highlight */}
      <div className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-inset ring-black/[0.03]" />
    </div>
  );
}
