"use client";

import { useCallback, useEffect, useState } from "react";

interface Notification {
  id: string;
  judul: string;
  pesan: string;
  tipe: string;
  is_read: boolean;
  created_at: string;
  whatsapp_status: string | null;
  bank_soal_id: string | null;
  peserta_id: string;
  profiles:
    | { nama: string }
    | { nama: string }[]
    | null;
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<
    Notification[]
  >([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadNotifications = useCallback(async () => {
    try {
      const response = await fetch("/api/guru/notifikasi", {
        cache: "no-store",
      });

      if (!response.ok) return;

      const result = await response.json();

      setNotifications(result.data || []);
      setUnread(result.belumDibaca || 0);
    } catch (error) {
      console.error("Gagal mengambil notifikasi:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();

    const interval = setInterval(
      loadNotifications,
      15000
    );

    return () => clearInterval(interval);
  }, [loadNotifications]);

  const markAsRead = async (id: string) => {
    try {
      const response = await fetch(
        `/api/guru/notifikasi/${id}`,
        {
          method: "PATCH",
        }
      );

      if (!response.ok) return;

      setNotifications((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, is_read: true }
            : item
        )
      );

      setUnread((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Gagal membaca notifikasi:", error);
    }
  };

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  };

  const getStudentName = (profile: Notification["profiles"]) => {
    if (Array.isArray(profile)) {
      return profile[0]?.nama || "Siswa";
    }

    return profile?.nama || "Siswa";
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="relative flex h-11 w-11 items-center justify-center rounded-xl border-2 border-black bg-white text-xl shadow-[3px_3px_0px_#000] transition hover:translate-y-0.5 hover:shadow-[1px_1px_0px_#000]"
        aria-label="Notifikasi"
      >
        🔔

        {unread > 0 && (
          <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-black bg-red-500 px-1 text-[10px] font-black text-white">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Tutup notifikasi"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
          />

          <div className="absolute right-0 top-14 z-50 w-[min(360px,calc(100vw-32px))] overflow-hidden rounded-2xl border-2 border-black bg-white shadow-[6px_6px_0px_#000]">
            <div className="flex items-center justify-between border-b-2 border-black bg-yellow-300 p-4">
              <div>
                <h3 className="font-black text-black">
                  NOTIFIKASI
                </h3>
                <p className="text-xs font-medium text-black">
                  {unread} belum dibaca
                </p>
              </div>

              <button
                type="button"
                onClick={loadNotifications}
                className="rounded-lg border-2 border-black bg-white px-3 py-1 text-xs font-bold shadow-[2px_2px_0px_#000]"
              >
                ↻ Refresh
              </button>
            </div>

            <div className="max-h-[420px] overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center text-sm font-semibold">
                  Memuat notifikasi...
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="mb-2 text-4xl">📭</div>
                  <p className="font-bold">
                    Belum ada notifikasi
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Notifikasi pengumpulan siswa akan muncul di sini.
                  </p>
                </div>
              ) : (
                notifications.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      if (!item.is_read) {
                        markAsRead(item.id);
                      }
                    }}
                    className={`w-full border-b border-gray-200 p-4 text-left transition hover:bg-yellow-50 ${
                      !item.is_read ? "bg-blue-50" : "bg-white"
                    }`}
                  >
                    <div className="flex gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-black bg-yellow-300 text-lg">
                        📝
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-black text-black">
                            {item.judul}
                          </p>

                          {!item.is_read && (
                            <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-blue-600" />
                          )}
                        </div>

                        <p className="mt-1 text-xs leading-relaxed text-gray-600">
                          {getStudentName(item.profiles)}{" "}
                          mengumpulkan jawaban.
                        </p>

                        <p className="mt-2 text-[11px] font-medium text-gray-400">
                          {formatDate(item.created_at)}
                        </p>

                        <div className="mt-2">
                          {item.whatsapp_status === "sent" ? (
                            <span className="rounded-md border border-green-300 bg-green-100 px-2 py-1 text-[10px] font-bold text-green-700">
                              ✓ WhatsApp terkirim
                            </span>
                          ) : item.whatsapp_status === "failed" ? (
                            <span className="rounded-md border border-red-300 bg-red-100 px-2 py-1 text-[10px] font-bold text-red-700">
                              ✕ WhatsApp gagal
                            </span>
                          ) : item.whatsapp_status === "pending" ? (
                            <span className="rounded-md border border-yellow-300 bg-yellow-100 px-2 py-1 text-[10px] font-bold text-yellow-700">
                              Menunggu WhatsApp
                            </span>
                          ) : (
                            <span className="rounded-md border border-gray-300 bg-gray-100 px-2 py-1 text-[10px] font-bold text-gray-600">
                              WhatsApp tidak tersedia
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>

            <div className="border-t-2 border-black bg-gray-50 p-3 text-center">
              <p className="text-[10px] font-semibold text-gray-500">
                Pembaruan otomatis setiap 15 detik
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}