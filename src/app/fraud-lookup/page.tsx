"use client"

import { useState } from "react"
import { Search, AlertTriangle, ShieldCheck, ShieldAlert, Loader2, Send } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"

const CHAINS = [
  { value: "ethereum", label: "Ethereum" },
  { value: "polygon", label: "Polygon" },
  { value: "bsc", label: "BNB Smart Chain" },
  { value: "solana", label: "Solana" },
]

// ─────────────────────────────────────────────
// 사기 조회 결과 타입
// ─────────────────────────────────────────────
interface LookupResult {
  found: boolean
  address: string
  chain: string
  risk_level?: string
  report_count?: number
  source_type?: string
  status?: string
  first_reported_at?: string
}

// ─────────────────────────────────────────────
// 위험도 배지 색상 매핑
// ─────────────────────────────────────────────
function riskBadge(level: string) {
  switch (level) {
    case "critical": return <Badge variant="destructive" className="animate-pulse">🔴 Critical</Badge>
    case "high":     return <Badge variant="destructive">🟠 High</Badge>
    case "medium":   return <Badge className="bg-amber-500 hover:bg-amber-600 text-white">🟡 Medium</Badge>
    case "low":      return <Badge variant="secondary">🟢 Low</Badge>
    default:         return <Badge variant="outline">{level}</Badge>
  }
}

export default function FraudLookupPage() {
  return (
    <div className="container mx-auto max-w-3xl py-8 px-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
          사기 주소 조회 & 신고
        </h1>
        <p className="mt-2 text-muted-foreground">
          의심 주소를 조회하거나, 새로운 사기 주소를 신고할 수 있습니다.
        </p>
      </div>

      <Tabs defaultValue="lookup" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="lookup" className="flex items-center gap-2">
            <Search className="h-4 w-4" /> 조회
          </TabsTrigger>
          <TabsTrigger value="report" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" /> 신고
          </TabsTrigger>
        </TabsList>

        {/* ─── FE-FRAUD-001: 조회 탭 ─── */}
        <TabsContent value="lookup">
          <LookupTab />
        </TabsContent>

        {/* ─── FE-FRAUD-002: 신고 탭 ─── */}
        <TabsContent value="report">
          <ReportTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ═══════════════════════════════════════════════
// FE-FRAUD-001: 사기 주소 조회 탭
// ═══════════════════════════════════════════════
function LookupTab() {
  const [address, setAddress] = useState("")
  const [chain, setChain] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<LookupResult | null>(null)
  const [searched, setSearched] = useState(false)
  const { toast } = useToast()

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!address || !chain) {
      toast({ variant: "destructive", title: "입력 누락", description: "주소와 체인을 모두 입력해주세요." })
      return
    }

    setLoading(true)
    setResult(null)
    try {
      const res = await fetch(`/api/v1/fraud/lookup?address=${encodeURIComponent(address)}&chain=${chain}`)
      const data = await res.json()

      if (data.success) {
        setResult(data.data)
      } else {
        toast({ variant: "destructive", title: "조회 실패", description: data.error.message })
      }
    } catch (err) {
      toast({ variant: "destructive", title: "에러", description: "서버와 통신할 수 없습니다." })
    } finally {
      setLoading(false)
      setSearched(true)
    }
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-lg">주소 위험도 조회</CardTitle>
        <CardDescription>지갑 주소와 체인을 선택한 뒤 조회 버튼을 눌러주세요.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleLookup} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="lookup-address">지갑 주소</Label>
            <Input
              id="lookup-address"
              placeholder="0x... 또는 Base58 주소"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="font-mono text-sm"
            />
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
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
            조회하기
          </Button>
        </form>

        {/* 결과 영역 */}
        {searched && result && (
          <div className="mt-6 space-y-3 animate-in fade-in-50 slide-in-from-bottom-4 duration-300">
            {result.found ? (
              <Alert variant="destructive">
                <ShieldAlert className="h-5 w-5" />
                <AlertTitle className="flex items-center gap-2">
                  ⚠️ 사기 의심 주소 탐지
                  {result.risk_level && riskBadge(result.risk_level)}
                </AlertTitle>
                <AlertDescription className="mt-3 space-y-2 text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-muted-foreground">누적 신고:</span>
                    <span className="font-semibold">{result.report_count}건</span>
                    <span className="text-muted-foreground">출처:</span>
                    <span>{result.source_type}</span>
                    <span className="text-muted-foreground">상태:</span>
                    <span>{result.status}</span>
                    <span className="text-muted-foreground">최초 신고일:</span>
                    <span>{result.first_reported_at ? new Date(result.first_reported_at).toLocaleDateString("ko-KR") : "-"}</span>
                  </div>
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="border-green-500/50 bg-green-50 dark:bg-green-950/20">
                <ShieldCheck className="h-5 w-5 text-green-600" />
                <AlertTitle className="text-green-700 dark:text-green-400">안전한 주소</AlertTitle>
                <AlertDescription className="text-green-600 dark:text-green-400">
                  해당 주소에 대한 사기 신고 내역이 없습니다.
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
// FE-FRAUD-002: 사기 주소 신고 탭
// ═══════════════════════════════════════════════
function ReportTab() {
  const [address, setAddress] = useState("")
  const [chain, setChain] = useState("")
  const [description, setDescription] = useState("")
  const [evidenceUrl, setEvidenceUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const { toast } = useToast()

  const handleSubmitReport = async () => {
    setLoading(true)
    setDialogOpen(false)
    try {
      const res = await fetch("/api/v1/fraud/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reported_address: address,
          chain,
          description,
          evidence_url: evidenceUrl,
        }),
      })
      const data = await res.json()

      if (data.success) {
        toast({
          title: "신고 접수 완료",
          description: `신고 ID: ${data.data.report_id} — 운영팀이 검토합니다.`,
        })
        setAddress("")
        setChain("")
        setDescription("")
        setEvidenceUrl("")
      } else {
        toast({ variant: "destructive", title: "신고 실패", description: data.error.message })
      }
    } catch (err) {
      toast({ variant: "destructive", title: "에러", description: "서버와 통신할 수 없습니다." })
    } finally {
      setLoading(false)
    }
  }

  const isValid = address && chain && description.length >= 10 && evidenceUrl.startsWith("http")

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-lg">사기 주소 신고</CardTitle>
        <CardDescription>
          사기 의심 주소를 신고해주세요. 이메일 인증이 완료된 사용자만 신고할 수 있습니다.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="report-address">사기 의심 주소</Label>
          <Input
            id="report-address"
            placeholder="0x... 또는 Base58 주소"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="font-mono text-sm"
          />
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
          <Label htmlFor="description">피해 내역 <span className="text-xs text-muted-foreground">(10자 이상)</span></Label>
          <Textarea
            id="description"
            placeholder="구체적인 피해 내용을 입력해주세요..."
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <p className="text-xs text-muted-foreground text-right">{description.length}자</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="evidence">증빙 URL</Label>
          <Input
            id="evidence"
            type="url"
            placeholder="https://etherscan.io/tx/..."
            value={evidenceUrl}
            onChange={(e) => setEvidenceUrl(e.target.value)}
          />
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full" disabled={!isValid || loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              신고 접수
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>신고를 접수하시겠습니까?</DialogTitle>
              <DialogDescription className="space-y-2 pt-2">
                <p>아래 정보가 운영팀에 전달됩니다.</p>
                <div className="rounded-md bg-muted p-3 text-sm space-y-1">
                  <p><span className="text-muted-foreground">주소:</span> <span className="font-mono">{address}</span></p>
                  <p><span className="text-muted-foreground">체인:</span> {chain}</p>
                  <p><span className="text-muted-foreground">내용:</span> {description.slice(0, 50)}...</p>
                </div>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>취소</Button>
              <Button variant="destructive" onClick={handleSubmitReport}>확인 접수</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
