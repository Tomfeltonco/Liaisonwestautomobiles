import { AdminLayout } from "@/components/admin-layout";
import { useListUsers } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, AlertCircle } from "lucide-react";

export default function AdminUsers() {
  const { data: users, isLoading } = useListUsers();

  return (
    <AdminLayout title="Manage Users">
      <div className="bg-card border border-white/5 rounded-xl overflow-hidden">
        <Table>
          <TableHeader className="bg-white/5">
            <TableRow className="border-white/5 hover:bg-transparent">
              <TableHead className="text-muted-foreground">ID</TableHead>
              <TableHead className="text-muted-foreground">Name</TableHead>
              <TableHead className="text-muted-foreground">Contact</TableHead>
              <TableHead className="text-muted-foreground">Role</TableHead>
              <TableHead className="text-muted-foreground">Location</TableHead>
              <TableHead className="text-muted-foreground">Verification</TableHead>
              <TableHead className="text-muted-foreground">Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i} className="border-white/5">
                  <TableCell><Skeleton className="h-4 w-8 bg-white/5" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32 bg-white/5" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-40 bg-white/5" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-16 bg-white/5" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24 bg-white/5" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20 bg-white/5" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24 bg-white/5" /></TableCell>
                </TableRow>
              ))
            ) : users?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              users?.map((user) => (
                <TableRow key={user.id} className="border-white/5 hover:bg-white/5">
                  <TableCell className="font-medium text-muted-foreground">#{user.id}</TableCell>
                  <TableCell className="text-white font-medium">{user.name}</TableCell>
                  <TableCell>
                    <div className="text-sm text-white">{user.email}</div>
                    {user.phone && <div className="text-xs text-muted-foreground">{user.phone}</div>}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-white/10 uppercase tracking-wider text-[10px]">{user.role}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {user.city ? `${user.city}, ${user.state}` : 'Not set'}
                  </TableCell>
                  <TableCell>
                    {user.verificationStatus === 'approved' ? (
                      <Badge className="bg-green-500/20 text-green-500 border-none"><CheckCircle2 className="w-3 h-3 mr-1"/> Verified</Badge>
                    ) : user.verificationStatus === 'pending' ? (
                      <Badge variant="outline" className="border-yellow-500/50 text-yellow-500"><AlertCircle className="w-3 h-3 mr-1"/> Pending</Badge>
                    ) : (
                      <Badge variant="outline" className="border-white/10 text-muted-foreground">Unverified</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </AdminLayout>
  );
}
