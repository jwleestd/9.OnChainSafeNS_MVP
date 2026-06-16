import Link from "next/link"
import { ShieldAlert, Search, ArrowRightLeft, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function HomePage() {
  return (
    <div className="flex flex-col items-center">
      {/* Hero */}
      <section className="w-full py-20 md:py-32 lg:py-40 border-b bg-gradient-to-b from-background to-muted/30">
        <div className="container mx-auto flex flex-col items-center gap-6 text-center px-4">
          <div className="rounded-full bg-primary/10 p-4 mb-2">
            <ShieldAlert className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
            <span className="bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 bg-clip-text text-transparent">
              OnChain SafeNS
            </span>
          </h1>
          <p className="max-w-[600px] text-muted-foreground md:text-xl">
            Web3 사기 방지 및 안전한 송금을 위한 네이밍 서비스.
            <br />
            사기 주소를 조회하고, Safe-Name으로 안전하게 송금하세요.
          </p>
          <div className="flex gap-3 mt-4">
            <Button size="lg" asChild>
              <Link href="/fraud-lookup">사기 주소 조회</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/safe-name">Safe-Name 서비스</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto py-16 px-4">
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="group hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <div className="rounded-lg bg-red-500/10 w-fit p-3 mb-2 group-hover:bg-red-500/20 transition-colors">
                <Search className="h-6 w-6 text-red-500" />
              </div>
              <CardTitle>사기 주소 조회 & 신고</CardTitle>
              <CardDescription>
                지갑 주소의 사기 이력을 실시간으로 조회하고, 새로운 사기 주소를 신고하세요.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="link" className="p-0" asChild>
                <Link href="/fraud-lookup">바로가기 →</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <div className="rounded-lg bg-blue-500/10 w-fit p-3 mb-2 group-hover:bg-blue-500/20 transition-colors">
                <FileText className="h-6 w-6 text-blue-500" />
              </div>
              <CardTitle>Safe-Name 등록 & 리졸브</CardTitle>
              <CardDescription>
                사람이 읽을 수 있는 이름을 등록하고, 이름으로 지갑 주소를 안전하게 확인하세요.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="link" className="p-0" asChild>
                <Link href="/safe-name">바로가기 →</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <div className="rounded-lg bg-green-500/10 w-fit p-3 mb-2 group-hover:bg-green-500/20 transition-colors">
                <ArrowRightLeft className="h-6 w-6 text-green-500" />
              </div>
              <CardTitle>데모 이체 시뮬레이션</CardTitle>
              <CardDescription>
                Safe-Name으로 송금하면 자동으로 사기 DB를 교차 검증합니다. (실제 트랜잭션 없음)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="link" className="p-0" asChild>
                <Link href="/safe-name">바로가기 →</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}
