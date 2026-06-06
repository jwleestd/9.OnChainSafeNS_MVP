"use client"

import { useEffect, useState } from "react"
import { Loader2, Check, X, FileWarning } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"

interface PendingReport {
  reportId: string
  reportedAddress: string
  chain: string
  description: string
  evidenceUrl: string
  reportedAt: string
  reporter: {
    email: string
  }
}

export default function AdminApprovalPage() {
  const [reports, setReports] = useState<PendingReport[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [rejectNotes, setRejectNotes] = useState("")
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchPendingReports = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/v1/admin/approve")
      const data = await res.json()
      if (data.success) {
        setReports(data.data)
      } else {
        toast({ variant: "destructive", title: "목록 조회 실패", description: data.error?.message })
      }
    } catch (err) {
      toast({ variant: "destructive", title: "에러", description: "서버와 통신할 수 없습니다." })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchPendingReports() }, [])

  const handleAction = async (reportId: string, action: "approve" | "reject", notes?: string) => {
    setActionLoading(reportId)
    try {
      const res = await fetch("/api/v1/admin/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          report_id: reportId,
          action,
          reviewer_notes: notes,
        }),
      })
      const data = await res.json()

      if (data.success) {
        const actionText = action === "approve" ? "승인" : "거부"
        toast({ title: `${actionText} 완료`, description: `신고 ${reportId.slice(0, 8)}...이 ${actionText}되었습니다.` })
        fetchPendingReports() // 목록 갱신
      } else {
        toast({ variant: "destructive", title: "처리 실패", description: data.error.message })
      }
    } catch (err) {
      toast({ variant: "destructive", title: "에러", description: "서버와 통신할 수 없습니다." })
    } finally {
      setActionLoading(null)
      setRejectDialogOpen(false)
      setRejectNotes("")
      setSelectedReportId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-5xl py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          운영자 신고 승인 대시보드
        </h1>
        <p className="mt-2 text-muted-foreground">
          사기 신고를 검토하고 승인 또는 거부합니다.
        </p>
      </div>

      {reports.length === 0 ? (
        <Alert className="border-blue-500/50">
          <FileWarning className="h-4 w-4" />
          <AlertTitle>처리 대기 중인 신고가 없습니다</AlertTitle>
          <AlertDescription>모든 신고가 처리 완료된 상태입니다.</AlertDescription>
        </Alert>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              대기 중인 신고
              <Badge variant="secondary">{reports.length}건</Badge>
            </CardTitle>
            <CardDescription>각 신고를 검토하고 승인 또는 거부를 선택하세요.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]">ID</TableHead>
                    <TableHead>주소</TableHead>
                    <TableHead className="w-[90px]">체인</TableHead>
                    <TableHead className="hidden md:table-cell">신고자</TableHead>
                    <TableHead className="hidden md:table-cell w-[100px]">접수일</TableHead>
                    <TableHead className="text-right w-[160px]">액션</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report) => (
                    <TableRow key={report.reportId}>
                      <TableCell className="font-mono text-xs">
                        {report.reportId.slice(0, 8)}...
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-mono text-xs truncate max-w-[200px]">{report.reportedAddress}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">{report.description}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{report.chain}</Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                        {report.reporter.email}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                        {new Date(report.reportedAt).toLocaleDateString("ko-KR")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 h-8"
                            disabled={actionLoading === report.reportId}
                            onClick={() => handleAction(report.reportId, "approve")}
                          >
                            {actionLoading === report.reportId ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <><Check className="mr-1 h-3 w-3" /> 승인</>
                            )}
                          </Button>

                          <Dialog
                            open={rejectDialogOpen && selectedReportId === report.reportId}
                            onOpenChange={(open) => {
                              setRejectDialogOpen(open)
                              if (open) setSelectedReportId(report.reportId)
                            }}
                          >
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="destructive"
                                className="h-8"
                                disabled={actionLoading === report.reportId}
                              >
                                <X className="mr-1 h-3 w-3" /> 거부
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>신고 거부</DialogTitle>
                                <DialogDescription>거부 사유를 입력해주세요.</DialogDescription>
                              </DialogHeader>
                              <div className="space-y-2 py-2">
                                <Label htmlFor="reject-notes">거부 사유</Label>
                                <Textarea
                                  id="reject-notes"
                                  placeholder="거부 사유를 작성해주세요..."
                                  rows={3}
                                  value={rejectNotes}
                                  onChange={(e) => setRejectNotes(e.target.value)}
                                />
                              </div>
                              <DialogFooter>
                                <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>취소</Button>
                                <Button
                                  variant="destructive"
                                  disabled={actionLoading !== null}
                                  onClick={() => handleAction(report.reportId, "reject", rejectNotes)}
                                >
                                  {actionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                  거부 확인
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
