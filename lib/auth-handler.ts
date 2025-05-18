import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "./auth";
import { authenticateToken } from "./token-auth";

// Check if an account is active
export function isActiveAccount(user: any) {
    if (user.isActive) {
        return user;
    }

    return NextResponse.json(
        { error: "Account is not active. Please wait for admin approval." },
        { status: 403 }
    );
}

// For API routes that need auth from either source (single non-high-order wrapper function)
// TODO Currently this one is used for simplicity, but in the future we can possibly use the high-order wrapper function
export async function authHandler(request: NextRequest) {
    const userFromToken = await authenticateToken(request);
    if (userFromToken) {
        return isActiveAccount(userFromToken);
    }

    const userFromCookie = await getCurrentUser();
    if (userFromCookie) {
        return isActiveAccount(userFromCookie);
    }

    return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
    );
}

// For API routes that need auth from either source (High-order wrapper function. currently not used)
// export async function withAuth(
//     request: NextRequest,
//     handler: (req: NextRequest, user: any) => Promise<NextResponse>
// ) {
//     // First try token authentication
//     const userFromToken = await authenticateToken(request);
//     if (userFromToken) {
//         return handler(request, userFromToken);
//     }

//     // Then try cookie authentication
//     const userFromCookie = await getCurrentUser();
//     if (userFromCookie) {
//         return handler(request, userFromCookie);
//     }

//     // If no auth, return unauthorized
//     return NextResponse.json(
//         { error: "Unauthorized" },
//         { status: 401 }
//     );
// }

