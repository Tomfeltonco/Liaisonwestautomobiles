import { AdminLayout } from "@/components/admin-layout";
import { useListLoans, getListLoansQueryKey, useUpdateLoan } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";

export default function AdminLoans() {
  const queryClient = useQueryClient();
  const { data: loans, isLoading } = useListLoans();

  const updateLoanMutation = useUpdateLoan({
    mutation: {
      onSuccess: () => {
        toast.success("Loan application updated");
        queryClient.invalidateQueries({ queryKey: getListLoansQueryKey() });
      },
      onError: (err: any) => {
        toast.error(err.message || "Failed to update loan");
      }
    }
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(price);
  };

  const handleStatusChange = (id: number, status: string) => {
    updateLoanMutation.mutate({ id, data: { status: status as any } });
  };

  return (
    <AdminLayout title="Loan Applications">
      <div className="bg-card border border-white/5 rounded-xl overflow-hidden">
        <Table>
          <TableHeader className="bg-white/5">
            <TableRow className="border-white/5 hover:bg-transparent">
              <TableHead className="text-muted-foreground">ID</TableHead>
              <TableHead className="text-muted-foreground">User</TableHead>
              <TableHead className="text-muted-foreground">Loan Details</TableHead>
              <TableHead className="text-muted-foreground">Applicant Financials</TableHead>
              <TableHead className="text-muted-foreground">Verification</TableHead>
              <TableHead className="text-muted-foreground">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i} className="border-white/5">
                  <TableCell><Skeleton className="h-4 w-8 bg-white/5" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24 bg-white/5" /></TableCell>
                  <TableCell><Skeleton className="h-12 w-48 bg-white/5" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-32 bg-white/5" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-24 bg-white/5" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-32 bg-white/5" /></TableCell>
                </TableRow>
              ))
            ) : loans?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No loan applications found
                </TableCell>
              </TableRow>
            ) : (
              loans?.map((loan) => (
                <TableRow key={loan.id} className="border-white/5 hover:bg-white/5">
                  <TableCell className="font-medium text-white">#{loan.id}</TableCell>
                  <TableCell className="text-muted-foreground">User ID: {loan.userId}</TableCell>
                  <TableCell>
                    <div className="font-medium text-white">{formatPrice(loan.loanAmount)}</div>
                    <div className="text-xs text-muted-foreground">
                      {loan.termMonths}mo @ {(loan.interestRate * 100).toFixed(2)}% APR
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-white capitalize">{loan.employmentStatus?.replace('_', ' ')}</div>
                    <div className="text-xs text-muted-foreground">Income: {loan.annualIncome ? formatPrice(loan.annualIncome) : 'N/A'}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {loan.idVerified ? <Badge className="bg-green-500/20 text-green-500 border-none text-[10px]">ID Verified</Badge> : <Badge variant="outline" className="text-[10px] text-yellow-500 border-yellow-500/50">ID Pending</Badge>}
                      {loan.ssnVerified ? <Badge className="bg-green-500/20 text-green-500 border-none text-[10px]">SSN Verified</Badge> : <Badge variant="outline" className="text-[10px] text-yellow-500 border-yellow-500/50">SSN Pending</Badge>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Select defaultValue={loan.status} onValueChange={(v) => handleStatusChange(loan.id, v)}>
                      <SelectTrigger className={`border-white/10 h-8 text-xs ${
                        loan.status === 'approved' || loan.status === 'completed' ? 'text-green-500' :
                        loan.status === 'rejected' ? 'text-red-500' :
                        loan.status === 'under_review' ? 'text-blue-500' : 'text-yellow-500'
                      }`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="under_review">Under Review</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </AdminLayout>
  );
}
