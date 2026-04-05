import { withAuth } from "next-auth/middleware"

export default withAuth({
  pages: {
    signIn: '/login',
  },
})

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth API routes)
     * - api/tax-assistant (Tax Bot API)
     * - tax-assistant (Tax Bot Dedicated Page)
     * - login (the login page itself)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api/auth|api/tax-assistant|tax-assistant|login|_next/static|_next/image|favicon.ico).*)',
  ],
}
