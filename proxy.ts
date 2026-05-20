import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export default async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Si las variables no están configuradas, dejar pasar sin autenticar
  // (evita crash en arranque antes de configurar .env.local)
  if (!supabaseUrl || !supabaseKey) {
    return response
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        )
      },
    },
  })

  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname

  const isAuthPage      = ['/login', '/signup'].some(p => path.startsWith(p))
  const isProtectedPage = ['/dashboard', '/editor', '/settings', '/projects'].some(p => path.startsWith(p))

  if (!user && isProtectedPage)
    return NextResponse.redirect(new URL('/login', request.url))

  if (user && isAuthPage)
    return NextResponse.redirect(new URL('/dashboard', request.url))

  if (path === '/' && user)
    return NextResponse.redirect(new URL('/dashboard', request.url))

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon|api).*)'],
}
