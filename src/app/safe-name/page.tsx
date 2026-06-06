"use client"

import { useState } from "react"
import { FileText, Search, ArrowRightLeft, Loader2, ShieldAlert, ShieldCheck, AlertTriangle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"

const CHAINS = [
  { value: "ethereum", label: "Ethereum" },
  { value: "polygon", label: "Polygon" },
  { value: "bsc", label: "BNB Smart Chain" },
  { value: "solana", label: "Solana" },
]

export default function SafeNamePage() {
  return (
    <div className="container mx-auto max-w-3xl py-8 px-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Safe-Name 서비스
        </h1>
        <p className="mt-2 text-muted-foreground">
          사람이 읽을 수 있는 이름으로 안전하게 송금하세요.
        </p>
      </div>

      <Tabs defaultValue="register" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="register" className="flex items-center gap-2">
            <FileText className="h-4 w-4" /> 등록
          </TabsTrigger>
          <TabsTrigger value="resolve" className="flex items-center gap-2">
            <Search className="h-4 w-4" /> 리졸브
          </TabsTrigger>
          <TabsTrigger value="transfer" className="flex items-center gap-2">
            <ArrowRightLeft className="h-4 w-4" /> 이체
          </TabsTrigger>
        </TabsList>

        {/* ─── FE-SN-001: 등록 탭 ─── */}
        <TabsContent value="register">
          <RegisterTab />
        </TabsContent>

        {/* ─── FE-SN-002: 리졸브 탭 ─── */}
        <TabsContent value="resolve">
          <ResolveTab />
        </TabsContent>

        {/* ─── FE-TX-001: 이체 탭 ─── */}
        <TabsContent value="transfer">
          <TransferTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ═══════════════════════════════════════════════
// FE-SN-001: Safe-Name 등록 탭
// ═══════════════════════════════════════════════
function RegisterTab() {
  const [humanName, setHumanName] = useState("")
  const [chain, setChain] = useState("")
  const [walletAddress, setWalletAddress] = useState("")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch("/api/v1/safename/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          human_name: humanName,
          wallet_address: walletAddress,
          chain,
        }),
      })
      const data = await res.json()

      if (data.success) {
        toast({
          title: "등록 완료 🎉",
          description: `${data.data.human_name} 이름이 성공적으로 등록되었습니다.`,
        })
        setHumanName("")
        setWalletAddress("")
        setChain("")
      } else {
        toast({ variant: "destructive", title: "등록 실패", description: data.error.message })
      }
    } catch (err) {
      toast({ variant: "destructive", title: "에러", description: "서버와 통신할 수 없습니다." })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-lg">Safe-Name 등록</CardTitle>
        <CardDescription>
          원하는 이름을 등록하여 지갑 주소와 연결하세요. (영소문자, 숫자, 하이픈 / 3~20자)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="human-name">이름</Label>
            <div className="flex items-center gap-2">
              <Input
                id="human-name"
                placeholder="my-wallet"
                value={humanName}
                onChange={(e) => setHumanName(e.target.value.toLowerCase())}
                className="flex-1"
              />
              <span className="text-sm text-muted-foreground font-medium">.safe</span>
            </div>
            <p className="text-xs text-muted-foreground">영소문자, 숫자, 하이픈만 허용. 3~20자.</p>
          </div>

          <div className="space-y-2">
            <Label>체인</Label>
            <Select value={chain} onValueChange={setChain}>
              <SelectTrigger><SelectValue placeholder="체인 선택" /></SelectTrigger>
              <SelectContent>
                {CHAINS.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="wallet-address">지갑 주소</Label>
            <Input
              id="wallet-address"
              placeholder="0x... 또는 Base58 주소"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              className="font-mono text-sm"
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading || !humanName || !chain || !walletAddress}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            이름 등록
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

// ═══════════════════════════════════════════════
// FE-SN-002: Safe-Name 리졸브 탭
// ═══════════════════════════════════════════════
interface ResolveResult {
  name: string
  wallet_address: string
  chain: string
  status: string
  fraud_check: {
    is_flagged: boolean
    risk_level?: string
    report_count?: number
  }
}

function ResolveTab() {
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ResolveResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name) return

    setLoading(true)
    setResult(null)
    setError(null)
    try {
      const res = await fetch(`/api/v1/resolve?name=${encodeURIComponent(name)}`)
      const data = await res.json()

      if (data.success) {
        setResult(data.data)
      } else {
        setError(data.error.message)
      }
    } catch (err) {
      toast({ variant: "destructive", title: "에러", description: "서버와 통신할 수 없습니다." })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-lg">이름 리졸브</CardTitle>
        <CardDescription>Safe-Name을 입력하면 연결된 지갑 주소와 사기 여부를 확인합니다.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleResolve} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="resolve-name">Safe-Name</Label>
            <Input
              id="resolve-name"
              placeholder="alice.safe"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading || !name}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
            리졸브
          </Button>
        </form>

        {error && (
          <Alert variant="destructive" className="animate-in fade-in-50 duration-300">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>리졸브 실패</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {result && (
          <div className="mt-4 space-y-3 animate-in fade-in-50 slide-in-from-bottom-4 duration-300">
            <Card className="border-2">
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">이름</span>
                    <span className="font-semibold text-primary">{result.name}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">주소</span>
                    <span className="font-mono text-xs max-w-[200px] truncate">{result.wallet_address}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">체인</span>
                    <Badge variant="outline">{result.chain}</Badge>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">사기 상태</span>
                    {result.fraud_check.is_flagged ? (
                      <div className="flex items-center gap-2">
                        <ShieldAlert className="h-4 w-4 text-destructive" />
                        <Badge variant="destructive">
                          ⚠️ 사기 의심 ({result.fraud_check.risk_level}, {result.fraud_check.report_count}건)
                        </Badge>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-green-600" />
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">✅ 안전</Badge>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {result.fraud_check.is_flagged && (
              <Alert variant="destructive">
                <ShieldAlert className="h-4 w-4" />
                <AlertTitle>⚠️ 사기 경고</AlertTitle>
                <AlertDescription>
                  이 주소는 사기 DB에 등록되어 있습니다. 송금 시 주의하세요!
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ═══════════════════════════════════════════════
// FE-TX-001: 데모 이체 탭
// ═══════════════════════════════════════════════
interface TransferResult {
  transfer_id: string
  recipient_name: string
  resolved_address: string | null
  chain: string | null
  amount: number
  fraud_status: string
  fraud_detail: string | null
  transfer_status: string
  created_at: string
}

function TransferTab() {
  const [recipientName, setRecipientName] = useState("")
  const [amount, setAmount] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<TransferResult | null>(null)
  const { toast } = useToast()

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!recipientName || !amount) return

    setLoading(true)
    setResult(null)
    try {
      const res = await fetch("/api/v1/transfer/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient_name: recipientName,
          amount: Number(amount),
        }),
      })
      const data = await res.json()

      if (data.success) {
        setResult(data.data)
      } else {
        toast({ variant: "destructive", title: "이체 실패", description: data.error.message })
      }
    } catch (err) {
      toast({ variant: "destructive", title: "에러", description: "서버와 통신할 수 없습니다." })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-lg">데모 이체 시뮬레이션</CardTitle>
        <CardDescription>
          Safe-Name으로 송금하면 자동으로 사기 DB를 교차 검증합니다. (실제 블록체인 트랜잭션 없음)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleTransfer} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="recipient">수신자 이름</Label>
            <Input
              id="recipient"
              placeholder="alice.safe"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">송금액</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading || !recipientName || !amount}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRightLeft className="mr-2 h-4 w-4" />}
            이체 실행
          </Button>
        </form>

        {result && (
          <div className="mt-4 animate-in fade-in-50 slide-in-from-bottom-4 duration-300">
            {result.transfer_status === "completed" && (
              <Alert className="border-green-500/50 bg-green-50 dark:bg-green-950/20">
                <ShieldCheck className="h-5 w-5 text-green-600" />
                <AlertTitle className="text-green-700 dark:text-green-400">✅ 이체 완료 (시뮬레이션)</AlertTitle>
                <AlertDescription className="mt-2 space-y-1 text-sm">
                  <p><span className="text-muted-foreground">수신자:</span> {result.recipient_name}</p>
                  <p><span className="text-muted-foreground">주소:</span> <span className="font-mono">{result.resolved_address}</span></p>
                  <p><span className="text-muted-foreground">체인:</span> {result.chain}</p>
                  <p><span className="text-muted-foreground">금액:</span> {result.amount}</p>
                </AlertDescription>
              </Alert>
            )}

            {result.transfer_status === "blocked" && (
              <Alert variant="destructive">
                <ShieldAlert className="h-5 w-5" />
                <AlertTitle>🚫 이체 차단</AlertTitle>
                <AlertDescription className="mt-2 space-y-1 text-sm">
                  <p>사기 DB에 등록된 주소로의 이체가 차단되었습니다.</p>
                  <p><span className="text-muted-foreground">수신자:</span> {result.recipient_name}</p>
                  <p><span className="text-muted-foreground">주소:</span> <span className="font-mono">{result.resolved_address}</span></p>
                  {result.fraud_detail && (
                    <p><span className="text-muted-foreground">차단 사유:</span> {result.fraud_detail}</p>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {result.transfer_status === "name_not_found" && (
              <Alert>
                <AlertTriangle className="h-5 w-5" />
                <AlertTitle>이름을 찾을 수 없음</AlertTitle>
                <AlertDescription>
                  &quot;{result.recipient_name}&quot; 에 해당하는 Safe-Name이 등록되어 있지 않습니다.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
