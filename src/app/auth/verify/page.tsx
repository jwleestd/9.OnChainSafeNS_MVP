"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Mail } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { useToast } from "@/hooks/use-toast"

export default function VerifyEmailPage() {
  const [email, setEmail] = useState("")
  const [step, setStep] = useState<"email" | "code">("email")
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)
  
  const { toast } = useToast()
  const router = useRouter()

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setLoading(true)
    try {
      const res = await fetch("/api/v1/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()

      if (data.success) {
        toast({ title: "코드 발송 완료", description: data.data.message })
        setStep("code")
      } else {
        toast({ variant: "destructive", title: "발송 실패", description: data.error.message })
      }
    } catch (error) {
      toast({ variant: "destructive", title: "에러 발생", description: "서버와 통신할 수 없습니다." })
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (code.length !== 6) return

    setLoading(true)
    try {
      const res = await fetch("/api/v1/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      })
      const data = await res.json()

      if (data.success) {
        toast({ title: "인증 완료", description: "성공적으로 로그인되었습니다." })
        router.push("/fraud-lookup") // 인증 완료 후 메인 서비스로 이동
      } else {
        toast({ variant: "destructive", title: "인증 실패", description: data.error.message })
      }
    } catch (error) {
      toast({ variant: "destructive", title: "에러 발생", description: "서버와 통신할 수 없습니다." })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold tracking-tight">
            {step === "email" ? "이메일 인증" : "코드 입력"}
          </CardTitle>
          <CardDescription>
            {step === "email" 
              ? "서비스 이용을 위해 이메일을 인증해주세요." 
              : `${email}로 발송된 6자리 코드를 입력해주세요.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === "email" ? (
            <form onSubmit={handleSendCode} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">이메일 주소</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="name@example.com" 
                    className="pl-10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required 
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                인증 코드 발송
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyCode} className="space-y-6">
              <div className="flex justify-center py-4">
                <InputOTP maxLength={6} value={code} onChange={setCode}>
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
              <div className="space-y-2">
                <Button type="submit" className="w-full" disabled={code.length !== 6 || loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  인증 확인
                </Button>
                <Button 
                  type="button" 
                  variant="ghost" 
                  className="w-full" 
                  onClick={() => setStep("email")}
                  disabled={loading}
                >
                  다른 이메일 사용
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
