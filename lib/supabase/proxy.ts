import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },

        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          supabaseResponse = NextResponse.next({
            request,
          });

          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });

          Object.entries(headers).forEach(([key, value]) => {
            supabaseResponse.headers.set(key, value);
          });
        },
      },
    }
  );

  const pathname = request.nextUrl.pathname;

  // Verifikasi session
  const { data, error } = await supabase.auth.getClaims();

  const user = data?.claims;

  // Belum login
  if (error || !user?.sub) {
    return redirectWithCookies(request, "/login", supabaseResponse);
  }

  // Ambil profil pengguna
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, role, status_aktif")
    .eq("id", user.sub)
    .single();

  // Profil tidak ditemukan
  if (profileError || !profile) {
    await supabase.auth.signOut();

    return redirectWithCookies(request, "/login", supabaseResponse);
  }

  // Akun tidak aktif
  if (!profile.status_aktif) {
    await supabase.auth.signOut();

    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("error", "inactive");

    return redirectResponse(url, supabaseResponse);
  }

  // Validasi role
  const guruPath = pathname.startsWith("/dashboard/guru");
  const siswaPath = pathname.startsWith("/dashboard/siswa");

  // Siswa mencoba membuka halaman guru
  if (guruPath && profile.role !== "guru") {
    return redirectWithCookies(
      request,
      "/dashboard/siswa",
      supabaseResponse
    );
  }

  // Guru mencoba membuka halaman siswa
  if (siswaPath && profile.role !== "siswa") {
    return redirectWithCookies(
      request,
      "/dashboard/guru",
      supabaseResponse
    );
  }

  // Redirect root dashboard berdasarkan role
  if (pathname === "/dashboard") {
    return redirectWithCookies(
      request,
      profile.role === "guru"
        ? "/dashboard/guru"
        : "/dashboard/siswa",
      supabaseResponse
    );
  }

  return supabaseResponse;
}

function redirectWithCookies(
  request: NextRequest,
  path: string,
  response: NextResponse
) {
  const url = request.nextUrl.clone();
  url.pathname = path;
  url.search = "";

  return redirectResponse(url, response);
}

function redirectResponse(
  url: URL,
  response: NextResponse
) {
  const redirect = NextResponse.redirect(url);

  response.cookies.getAll().forEach((cookie) => {
    redirect.cookies.set(cookie);
  });

  return redirect;
}