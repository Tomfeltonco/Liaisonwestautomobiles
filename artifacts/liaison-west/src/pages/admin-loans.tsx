import { useState } from "react";
import { AdminLayout } from "@/components/admin-layout";
import { useListLoans, getListLoansQueryKey, useUpdateLoan } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, XCircle, Clock, Eye, ChevronDown, ChevronUp } from "lucide-react";

const STATUS_STYLE: Record<string, string> = {
  approved: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  completed: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  rejected: "bg-red-500/20 text-red-400 border-red-500/30",
  under_review: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  pending: "bg-yellow-500/20 text-yellow-600 border-yellow-500/30",
};

export default function AdminLoans() {
  const qc = useQueryClient();
  const { data: loans, isLoading } = useListLoans();
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [notes, setNotes] = useState<Record<number, string>>({});

  const updateLoan = useUpdateLoan({
    mutation: {
      onSuccess: (updated) => {
        toast.success(`Loan #${updated.id} updated to "${updated.status}"`);
        qc.invalidateQueries({ queryKey: getListLoansQueryKey() });
      },
      onError: () => toast.error("Failed to update loan"),
    },
  });

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

  const handleStatus = (id: number, status: string) => {
    updateLoan.mutate({ id, data: { status: status as any, adminNotes: notes[id] } });
  };

  return (
    <AdminLayout title="Loan Applications">
      <div className="bg-card border border-white/5 rounded-xl overflow-hidden">
        <Table>
          <TableHeader className="bg-white/5">
            <TableRow className="border-white/5 hover:bg-transparent">
              <TableHead className="text-muted-foreground w-10" />
              <TableHead className="text-muted-foreground">Application</TableHead>
              <TableHead className="text-muted-foreground">Vehicle</TableHead>
              <TableHead className="text-muted-foreground">Loan Terms</TableHead>
              <TableHead className="text-muted-foreground">Financials</TableHead>
              <TableHead className="text-muted-foreground">Verify</TableHead>
              <TableHead className="text-muted-foreground">Status</TableHead>
              <TableHead className="text-muted-foreground">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i} className="border-white/5">
                  {Array.from({ length: 8 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full bg-white/5" /></TableCell>
                  ))}
                </TableRow>
              ))
              : loans?.length === 0
                ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                      No loan applications found
                    </TableCell>
                  </TableRow>
                )
                : loans?.map((loan) => (
                  <>
                    <TableRow
                      key={loan.id}
                      className="border-white/5 hover:bg-white/5 cursor-pointer"
                      onClick={() => setExpandedId(expandedId === loan.id ? null : loan.id)}
                    >
                      <TableCell>
                        {expandedId === loan.id
                          ? <ChevronUp className="w-4 h-4 text-white/30" />
                          : <ChevronDown className="w-4 h-4 text-white/30" />}
                      </TableCell>
                      <TableCell>
                        <div className="font-mono text-white text-sm">#{loan.id}</div>
                        <div className="text-xs text-muted-foreground">User #{loan.userId}</div>
                        <div className="text-xs text-muted-foreground">{new Date(loan.createdAt).toLocaleDateString()}</div>
                      </TableCell>
                      <TableCell>
                        {loan.car ? (
                          <div>
                            <div className="text-white text-sm font-medium">{loan.car.year} {loan.car.make}</div>
                            <div className="text-xs text-muted-foreground">{loan.car.model}</div>
                            <div className="text-xs text-white/50 font-semibold">{fmt(loan.car.price)}</div>
                          </div>
                        ) : <span className="text-muted-foreground text-sm">Car #{loan.carId}</span>}
                      </TableCell>
                      <TableCell>
                        <div className="text-white text-sm font-semibold">{fmt(loan.loanAmount)}</div>
                        <div className="text-xs text-muted-foreground">{loan.termMonths} mo @ {loan.interestRate.toFixed(1)}% APR</div>
                        <div className="text-xs text-white/50">{fmt(loan.monthlyPayment)}/mo</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-white capitalize">{loan.employmentStatus?.replace("_", " ") || "—"}</div>
                        <div className="text-xs text-muted-foreground">{loan.annualIncome ? fmt(loan.annualIncome) + " /yr" : "N/A"}</div>
                        {loan.creditScore && <div className="text-xs font-semibold text-white/70">Score: {loan.creditScore}</div>}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge variant="outline" className={`text-[10px] border ${loan.idVerified ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" : "text-yellow-500 border-yellow-500/30"}`}>
                            {loan.idVerified ? "✓ ID" : "ID Pending"}
                          </Badge>
                          <Badge variant="outline" className={`text-[10px] border ${loan.ssnVerified ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" : "text-yellow-500 border-yellow-500/30"}`}>
                            {loan.ssnVerified ? "✓ SSN" : "SSN Pending"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-[10px] capitalize border ${STATUS_STYLE[loan.status] ?? ""}`}>
                          {loan.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <div className="flex gap-1.5">
                          {loan.status !== "approved" && loan.status !== "completed" && (
                            <Button
                              size="sm"
                              onClick={() => handleStatus(loan.id, "approved")}
                              disabled={updateLoan.isPending}
                              className="h-7 px-2.5 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30 text-[11px] font-semibold rounded-lg"
                            >
                              <CheckCircle2 className="w-3 h-3 mr-1" />Approve
                            </Button>
                          )}
                          {loan.status !== "rejected" && loan.status !== "completed" && (
                            <Button
                              size="sm"
                              onClick={() => handleStatus(loan.id, "rejected")}
                              disabled={updateLoan.isPending}
                              className="h-7 px-2.5 bg-red-500/15 text-red-400 hover:bg-red-500/25 border border-red-500/25 text-[11px] font-semibold rounded-lg"
                            >
                              <XCircle className="w-3 h-3 mr-1" />Decline
                            </Button>
                          )}
                          {loan.status === "pending" && (
                            <Button
                              size="sm"
                              onClick={() => handleStatus(loan.id, "under_review")}
                              disabled={updateLoan.isPending}
                              className="h-7 px-2.5 bg-purple-500/15 text-purple-400 hover:bg-purple-500/25 border border-purple-500/25 text-[11px] font-semibold rounded-lg"
                            >
                              <Clock className="w-3 h-3 mr-1" />Review
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>

                    {/* Expanded row — admin notes */}
                    {expandedId === loan.id && (
                      <TableRow key={`${loan.id}-notes`} className="border-white/5 bg-white/[0.02]">
                        <TableCell colSpan={8} className="py-4 px-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <p className="text-white/50 text-xs uppercase tracking-wider font-semibold mb-2">Application Details</p>
                              <div className="space-y-1.5 text-sm">
                                {[
                                  ["Loan Amount", fmt(loan.loanAmount)],
                                  ["Down Payment", fmt(loan.downPayment)],
                                  ["Principal", fmt(loan.loanAmount - loan.downPayment)],
                                  ["Interest Rate", `${loan.interestRate.toFixed(1)}% APR`],
                                  ["Monthly Payment", `${fmt(loan.monthlyPayment)}/mo`],
                                  ["Term", `${loan.termMonths} months`],
                                  ["Total Repayable", fmt(loan.monthlyPayment * loan.termMonths + loan.downPayment)],
                                ].map(([label, val]) => (
                                  <div key={label} className="flex justify-between">
                                    <span className="text-white/40">{label}</span>
                                    <span className="text-white font-medium">{val}</span>
                                  </div>
                                ))}
                                {loan.adminNotes && (
                                  <div className="mt-3 pt-3 border-t border-white/8">
                                    <p className="text-white/40 text-xs mb-1">Previous Notes</p>
                                    <p className="text-white/70 text-xs">{loan.adminNotes}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div>
                              <p className="text-white/50 text-xs uppercase tracking-wider font-semibold mb-2">Admin Notes</p>
                              <Textarea
                                value={notes[loan.id] ?? loan.adminNotes ?? ""}
                                onChange={(e) => setNotes({ ...notes, [loan.id]: e.target.value })}
                                placeholder="Add notes for this application..."
                                className="bg-white/5 border-white/10 text-white placeholder:text-white/20 rounded-xl text-sm resize-none mb-3"
                                rows={4}
                              />
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleStatus(loan.id, "approved")}
                                  disabled={updateLoan.isPending || loan.status === "approved"}
                                  className="h-9 flex-1 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30 font-semibold rounded-xl"
                                >
                                  <CheckCircle2 className="w-4 h-4 mr-1.5" />Approve Application
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleStatus(loan.id, "rejected")}
                                  disabled={updateLoan.isPending || loan.status === "rejected"}
                                  className="h-9 flex-1 bg-red-500/15 text-red-400 hover:bg-red-500/25 border border-red-500/25 font-semibold rounded-xl"
                                >
                                  <XCircle className="w-4 h-4 mr-1.5" />Decline Application
                                </Button>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))}
          </TableBody>
        </Table>
      </div>
    </AdminLayout>
  );
}
