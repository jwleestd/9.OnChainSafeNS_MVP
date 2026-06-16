"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Lock, ShieldAlert } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"

export default function AdminLoginPage() {
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  
  const { toast } = useToast()
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password) return

    setLoading(true)
    try {
      // Note: Phase-0에서는 실제 로그인 검증 API가 없음 (환경변수나 데모 설정에 따름)
      // MVP 목적에 맞춰, 임시로 패스워드가 "admin123"이면 통과시키는 목업을 작성합니다.
      // (실제 프로덕션은 별도 관리자 인증 체계 연동 필요)
      
      // 목업 로직 (데모용)
      setTimeout(() => {
        if (password === "admin123") {
          // 데모용으로 쿠키를 세팅하기 위해 별도 목업 엔드포인트나 프론트에서 처리할 수 없으므로,
          // 여기서는 개발 편의를 위해 JS 로 쿠키 세팅. 실제로는 API 필요
          document.cookie = "admin_session=mock_admin_token; path=/; max-age=86400"
          toast({ title: "관리자 로그인", description: "운영자 대시보드로 이동합니다." })
          router.push("/admin/approval")
        } else {
          toast({ variant: "destructive", title: "인증 실패", description: "비밀번호가 올바르지 않습니다. (admin123)" })
        }
        setLoading(false)
      }, 1000)

    } catch (error) {
      toast({ variant: "destructive", title: "에러 발생", description: "서버와 통신할 수 없습니다." })
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
      <Card className="w-full max-w-sm shadow-xl border-t-4 border-t-primary">
        <CardHeader className="space-y-2 text-center pb-6">
          <div className="flex justify-center mb-2">
            <div className="rounded-full bg-primary/10 p-3">
              <ShieldAlert className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Admin Console</CardTitle>
          <CardDescription>
            시스템 운영자 권한으로 로그인합니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">관리자 비밀번호</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="••••••••" 
                  className="pl-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              로그인
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
