import { AdminLayout } from "@/components/admin-layout";
import { useListAgents, getListAgentsQueryKey, useCreateAgent, useUpdateAgent } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus } from "lucide-react";

const agentSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z.string().optional(),
});

export default function AdminAgents() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const { data: agents, isLoading } = useListAgents();

  const createAgentMutation = useCreateAgent({
    mutation: {
      onSuccess: () => {
        toast.success("Agent created successfully");
        queryClient.invalidateQueries({ queryKey: getListAgentsQueryKey() });
        setIsDialogOpen(false);
        form.reset();
      },
      onError: (err: any) => {
        toast.error(err.message || "Failed to create agent");
      }
    }
  });

  const updateAgentMutation = useUpdateAgent({
    mutation: {
      onSuccess: () => {
        toast.success("Agent status updated");
        queryClient.invalidateQueries({ queryKey: getListAgentsQueryKey() });
      },
      onError: (err: any) => {
        toast.error(err.message || "Failed to update agent");
      }
    }
  });

  const form = useForm<z.infer<typeof agentSchema>>({
    resolver: zodResolver(agentSchema),
    defaultValues: { name: "", email: "", password: "", phone: "" },
  });

  const onSubmit = (values: z.infer<typeof agentSchema>) => {
    createAgentMutation.mutate({ data: values });
  };

  const toggleStatus = (id: number, currentStatus: boolean) => {
    updateAgentMutation.mutate({ id, data: { isActive: !currentStatus } });
  };

  return (
    <AdminLayout title="Manage Agents">
      <div className="flex justify-end mb-6">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> Add Agent</Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-white/10 sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-white">Add New Agent</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/80">Name</FormLabel>
                      <FormControl><Input className="bg-white/5 border-white/10" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/80">Email</FormLabel>
                      <FormControl><Input type="email" className="bg-white/5 border-white/10" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/80">Phone</FormLabel>
                      <FormControl><Input className="bg-white/5 border-white/10" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/80">Password</FormLabel>
                      <FormControl><Input type="password" className="bg-white/5 border-white/10" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full mt-4" disabled={createAgentMutation.isPending}>
                  {createAgentMutation.isPending ? "Creating..." : "Create Agent"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card border border-white/5 rounded-xl overflow-hidden">
        <Table>
          <TableHeader className="bg-white/5">
            <TableRow className="border-white/5 hover:bg-transparent">
              <TableHead className="text-muted-foreground">ID</TableHead>
              <TableHead className="text-muted-foreground">Agent Name</TableHead>
              <TableHead className="text-muted-foreground">Contact</TableHead>
              <TableHead className="text-muted-foreground">Status</TableHead>
              <TableHead className="text-muted-foreground">Uploads</TableHead>
              <TableHead className="text-muted-foreground">Joined</TableHead>
              <TableHead className="text-right text-muted-foreground">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i} className="border-white/5">
                  <TableCell><Skeleton className="h-4 w-8 bg-white/5" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32 bg-white/5" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-40 bg-white/5" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-16 bg-white/5" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-12 bg-white/5" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24 bg-white/5" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-20 ml-auto bg-white/5" /></TableCell>
                </TableRow>
              ))
            ) : agents?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No agents found
                </TableCell>
              </TableRow>
            ) : (
              agents?.map((agent) => (
                <TableRow key={agent.id} className="border-white/5 hover:bg-white/5">
                  <TableCell className="font-medium text-muted-foreground">#{agent.id}</TableCell>
                  <TableCell className="text-white font-medium">{agent.name}</TableCell>
                  <TableCell>
                    <div className="text-sm text-white">{agent.email}</div>
                    {agent.phone && <div className="text-xs text-muted-foreground">{agent.phone}</div>}
                  </TableCell>
                  <TableCell>
                    {agent.isActive ? (
                      <Badge className="bg-green-500/20 text-green-500 border-none">Active</Badge>
                    ) : (
                      <Badge variant="outline" className="border-white/10 text-muted-foreground">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-white">{agent.totalCarUploads}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{new Date(agent.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="border-white/10"
                      onClick={() => toggleStatus(agent.id, agent.isActive)}
                      disabled={updateAgentMutation.isPending}
                    >
                      {agent.isActive ? "Deactivate" : "Activate"}
                    </Button>
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
