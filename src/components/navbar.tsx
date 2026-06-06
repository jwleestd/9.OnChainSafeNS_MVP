"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ShieldAlert, LogOut } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"

export function Navbar() {
  const pathname = usePathname()
  const isAdminPage = pathname.startsWith("/admin")

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center px-4">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <ShieldAlert className="h-6 w-6 text-primary" />
            <span className="hidden font-bold sm:inline-block bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              OnChain SafeNS
            </span>
          </Link>
          {!isAdminPage && (
            <nav className="flex items-center space-x-6 text-sm font-medium">
              <Link
                href="/fraud-lookup"
                className={cn(
                  "transition-colors hover:text-foreground/80",
                  pathname === "/fraud-lookup" ? "text-foreground" : "text-foreground/60"
                )}
              >
                사기 조회 및 신고
              </Link>
              <Link
                href="/safe-name"
                className={cn(
                  "transition-colors hover:text-foreground/80",
                  pathname?.startsWith("/safe-name") ? "text-foreground" : "text-foreground/60"
                )}
              >
                Safe-Name 서비스
              </Link>
            </nav>
          )}
        </div>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            {/* 여백 혹은 추가 컴포넌트 */}
          </div>
          <nav className="flex items-center space-x-2">
            {isAdminPage && (
              <Button variant="ghost" size="sm" asChild>
                <Link href="/auth/admin-login">
                  <LogOut className="mr-2 h-4 w-4" />
                  로그아웃
                </Link>
              </Button>
            )}
            <ThemeToggle />
          </nav>
        </div>
      </div>
    </header>
  )
}
