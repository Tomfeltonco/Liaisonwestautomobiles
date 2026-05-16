import { AdminLayout } from "@/components/admin-layout";
import { useListCars, getListCarsQueryKey, useDeleteCar } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Edit, Trash2, ExternalLink } from "lucide-react";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminCars() {
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  const { data: carsData, isLoading } = useListCars({ limit: 100, search });

  const deleteMutation = useDeleteCar({
    mutation: {
      onSuccess: () => {
        toast.success("Vehicle deleted successfully");
        queryClient.invalidateQueries({ queryKey: getListCarsQueryKey() });
      },
      onError: (err: any) => {
        toast.error(err.message || "Failed to delete vehicle");
      }
    }
  });

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this vehicle?")) {
      deleteMutation.mutate({ id });
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(price);
  };

  return (
    <AdminLayout title="Manage Inventory">
      <div className="flex justify-between items-center mb-6">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search vehicles..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-card border-white/10"
          />
        </div>
        <Link href="/agent/dashboard">
          <Button>Add Vehicle</Button>
        </Link>
      </div>

      <div className="bg-card border border-white/5 rounded-xl overflow-hidden">
        <Table>
          <TableHeader className="bg-white/5">
            <TableRow className="border-white/5 hover:bg-transparent">
              <TableHead className="text-muted-foreground">ID</TableHead>
              <TableHead className="text-muted-foreground">Vehicle</TableHead>
              <TableHead className="text-muted-foreground">Price</TableHead>
              <TableHead className="text-muted-foreground">Status</TableHead>
              <TableHead className="text-muted-foreground">Agent</TableHead>
              <TableHead className="text-right text-muted-foreground">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i} className="border-white/5">
                  <TableCell><Skeleton className="h-4 w-8 bg-white/5" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-48 bg-white/5" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24 bg-white/5" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20 bg-white/5" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32 bg-white/5" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-24 ml-auto bg-white/5" /></TableCell>
                </TableRow>
              ))
            ) : carsData?.cars.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No vehicles found
                </TableCell>
              </TableRow>
            ) : (
              carsData?.cars.map((car) => (
                <TableRow key={car.id} className="border-white/5 hover:bg-white/5">
                  <TableCell className="font-medium text-muted-foreground">#{car.id}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded bg-muted overflow-hidden flex-shrink-0">
                        {car.images?.[0] && <img src={car.images[0]} alt="" className="w-full h-full object-cover" />}
                      </div>
                      <div>
                        <div className="font-medium text-white">{car.year} {car.make} {car.model}</div>
                        <div className="text-xs text-muted-foreground">{car.vin}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-white">{formatPrice(car.price)}</TableCell>
                  <TableCell>
                    <Badge className={
                      car.status === 'available' ? 'bg-green-500' :
                      car.status === 'sold' ? 'bg-red-500' : 'bg-yellow-500 text-yellow-950'
                    }>
                      {car.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{car.agentName || 'System'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/car/${car.id}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-white" title="View Listing">
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-white" title="Edit">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive" 
                        onClick={() => handleDelete(car.id)}
                        disabled={deleteMutation.isPending}
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
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
