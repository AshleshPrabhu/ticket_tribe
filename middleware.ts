import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function middleware(request: NextRequest) {
    const session = await auth.api.getSession({
        headers: request.headers
    });

    const protectedPaths = ['/predict', '/leaderboard', '/tribe', '/settings'];
    const isProtectedPath = protectedPaths.some(path => 
        request.nextUrl.pathname.startsWith(path)
    );

    if (isProtectedPath && !session) {
        return NextResponse.redirect(new URL('/sign-in', request.url));
    }

    const authPaths = ['/sign-in', '/sign-up'];
    const isAuthPath = authPaths.some(path => 
        request.nextUrl.pathname.startsWith(path)
    );

    if (isAuthPath && session) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};