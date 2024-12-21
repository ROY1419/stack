"use client";
import { useAuthStore } from "@/store/Auth"
import { useRouter } from "next/navigation"
import React from "react"

export default function Layout({ children }: { children: React.ReactNode }) {
    const { session } = useAuthStore()
    const router = useRouter()

    React.useEffect(() => {
        if (session) {
            router.push("/")
        }
    }, [session, router])
    if (session) {
        return null
    }
    return (
        <div className="">
            <div className="">
                {children}
            </div>
        </div>
    )
}


// import React from "react";

// export default function RootLayout({
//     children,
// }:Readonly<{
//     children:React.ReactNode;
// }>) {
//     return(
//         <html lang="en">
//             <nav></nav>
//             <body className={inter.className}>{children}</body>
//         </html>
//     );
// }