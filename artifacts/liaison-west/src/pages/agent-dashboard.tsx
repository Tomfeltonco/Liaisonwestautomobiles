import { AdminLayout } from "@/components/admin-layout";
import { useGetMe, useGetAgentCars, getGetAgentCarsQueryKey, getGetMeQueryKey, useCreateCar } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Car, Plus, DollarSign, ListOrdered, CheckCircle2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";

const carSchema = z.object({
  make: z.string().min(1, "Make is required"),
  model: z.string().min(1, "Model is required"),
  year: z.coerce.number().min(1900).max(new Date().getFullYear() + 1),
  price: z.coerce.number().min(1),
  mileage: z.coerce.number().min(0),
  color: z.string().min(1, "Color is required"),
  condition: z.enum(["new", "used", "certified"]),
  bodyType: z.string().min(1, "Body type is required"),
  transmission: z.enum(["automatic", "manual", "cvt"]),
  fuelType: z.enum(["gasoline", "diesel", "electric", "hybrid", "plug_in_hybrid"]),
  engine: z.string().optional(),
  horsepower: z.coerce.number().optional(),
  seatingCapacity: z.coerce.number().optional(),
  vin: z.string().optional(),
  description: z.string().optional(),
  images: z.string().optional(), // We'll split this by comma for the API
});

export default function AgentDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // If not agent, redirect
  if (user && user.role !== 'agent' && user.role !== 'admin') {
    setLocation("/");
  }

  const { data: agentData } = useGetMe({
    query: {
      enabled: !!user,
      queryKey: getGetMeQueryKey(),
    }
  });

  const { data: carsData, isLoading: isCarsLoading } = useGetAgentCars(user?.id || 0, {
    query: {
      enabled: !!user?.id,
      queryKey: getGetAgentCarsQueryKey(user?.id || 0),
    }
  });

  const createCarMutation = useCreateCar({
    mutation: {
      onSuccess: () => {
        toast.success("Vehicle listed successfully");
        queryClient.invalidateQueries({ queryKey: getGetAgentCarsQueryKey(user?.id || 0) });
        setIsDialogOpen(false);
        form.reset();
      },
      onError: (err: any) => {
        toast.error(err.message || "Failed to list vehicle");
      }
    }
  });

  const form = useForm<z.infer<typeof carSchema>>({
    resolver: zodResolver(carSchema),
    defaultValues: {
      make: "",
      model: "",
      year: new Date().getFullYear(),
      price: 0,
      mileage: 0,
      color: "",
      condition: "new",
      bodyType: "",
      transmission: "automatic",
      fuelType: "gasoline",
      engine: "",
      description: "",
      images: "",
    },
  });

  const onSubmit = (values: z.infer<typeof carSchema>) => {
    // Process images string into array
    const imagesArray = values.images 
      ? values.images.split(',').map(url => url.trim()).filter(url => url.length > 0)
      : [];

    createCarMutation.mutate({
      data: {
        ...values,
        images: imagesArray,
        features: [], // Simplified for this demo
      }
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(price);
  };

  const activeListings = carsData?.filter(c => c.status === 'available').length || 0;
  const soldListings = carsData?.filter(c => c.status === 'sold').length || 0;

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background selection:bg-white selection:text-black">
      {/* Agent Nav (simplified version of AdminLayout) */}
      <header className="bg-card border-b border-white/5 p-4 sticky top-0 z-10 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2">
          <div className="bg-white text-black p-1 rounded-sm">
            <Car className="h-4 w-4" />
          </div>
          <span className="font-serif font-bold tracking-widest text-white uppercase text-sm">
            LIAISON WEST <span className="text-muted-foreground ml-2">AGENT PORTAL</span>
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-sm text-white hidden sm:inline">{user?.name}</span>
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-white">Exit Portal</Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 container px-4 md:px-6 py-8 mx-auto max-w-6xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-serif font-bold text-white mb-2">Welcome, {user?.name?.split(' ')[0]}</h1>
            <p className="text-muted-foreground">Manage your portfolio of premium vehicles.</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-white text-black hover:bg-white/90">
                <Plus className="w-4 h-4 mr-2" /> List New Vehicle
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-white/10 sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-white text-xl">Create Vehicle Listing</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="make" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white/80">Make</FormLabel>
                        <FormControl><Input className="bg-white/5 border-white/10" placeholder="e.g. Porsche" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}/>
                    <FormField control={form.control} name="model" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white/80">Model</FormLabel>
                        <FormControl><Input className="bg-white/5 border-white/10" placeholder="e.g. 911 GT3" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}/>
                    <FormField control={form.control} name="year" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white/80">Year</FormLabel>
                        <FormControl><Input type="number" className="bg-white/5 border-white/10" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}/>
                    <FormField control={form.control} name="price" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white/80">Price ($)</FormLabel>
                        <FormControl><Input type="number" className="bg-white/5 border-white/10" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}/>
                    <FormField control={form.control} name="mileage" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white/80">Mileage</FormLabel>
                        <FormControl><Input type="number" className="bg-white/5 border-white/10" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}/>
                    <FormField control={form.control} name="color" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white/80">Color</FormLabel>
                        <FormControl><Input className="bg-white/5 border-white/10" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}/>
                    <FormField control={form.control} name="condition" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white/80">Condition</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger className="bg-white/5 border-white/10"><SelectValue/></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="new">New</SelectItem>
                            <SelectItem value="used">Used</SelectItem>
                            <SelectItem value="certified">Certified</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}/>
                    <FormField control={form.control} name="bodyType" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white/80">Body Type</FormLabel>
                        <FormControl><Input className="bg-white/5 border-white/10" placeholder="e.g. Coupe" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}/>
                    <FormField control={form.control} name="transmission" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white/80">Transmission</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger className="bg-white/5 border-white/10"><SelectValue/></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="automatic">Automatic</SelectItem>
                            <SelectItem value="manual">Manual</SelectItem>
                            <SelectItem value="cvt">CVT</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}/>
                    <FormField control={form.control} name="fuelType" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white/80">Fuel Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger className="bg-white/5 border-white/10"><SelectValue/></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="gasoline">Gasoline</SelectItem>
                            <SelectItem value="diesel">Diesel</SelectItem>
                            <SelectItem value="electric">Electric</SelectItem>
                            <SelectItem value="hybrid">Hybrid</SelectItem>
                            <SelectItem value="plug_in_hybrid">Plug-in Hybrid</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}/>
                    <FormField control={form.control} name="engine" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white/80">Engine (Optional)</FormLabel>
                        <FormControl><Input className="bg-white/5 border-white/10" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}/>
                    <FormField control={form.control} name="horsepower" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white/80">Horsepower (Optional)</FormLabel>
                        <FormControl><Input type="number" className="bg-white/5 border-white/10" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}/>
                    <FormField control={form.control} name="vin" render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel className="text-white/80">VIN (Optional)</FormLabel>
                        <FormControl><Input className="bg-white/5 border-white/10" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}/>
                    <FormField control={form.control} name="images" render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel className="text-white/80">Image URLs (comma separated)</FormLabel>
                        <FormControl><Textarea className="bg-white/5 border-white/10" placeholder="https://image1.jpg, https://image2.jpg" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}/>
                    <FormField control={form.control} name="description" render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel className="text-white/80">Description</FormLabel>
                        <FormControl><Textarea className="bg-white/5 border-white/10 min-h-[100px]" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}/>
                  </div>
                  
                  <div className="flex justify-end pt-4 border-t border-white/10">
                    <Button type="button" variant="outline" className="mr-2" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={createCarMutation.isPending}>
                      {createCarMutation.isPending ? "Listing..." : "Publish Listing"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-card border-white/5">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Listings</CardTitle>
              <ListOrdered className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{carsData?.length || 0}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-white/5">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Listings</CardTitle>
              <Car className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{activeListings}</div>
            </CardContent>
          </Card>

          <Card className="bg-card border-white/5">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Sold Vehicles</CardTitle>
              <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{soldListings}</div>
            </CardContent>
          </Card>
        </div>

        {/* Listings Table */}
        <h2 className="text-xl font-serif font-bold text-white mb-4">Your Inventory</h2>
        <div className="bg-card border border-white/5 rounded-xl overflow-hidden">
          <Table>
            <TableHeader className="bg-white/5">
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-muted-foreground">Vehicle</TableHead>
                <TableHead className="text-muted-foreground">Price</TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
                <TableHead className="text-muted-foreground">Views/Leads</TableHead>
                <TableHead className="text-muted-foreground text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isCarsLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i} className="border-white/5">
                    <TableCell><Skeleton className="h-10 w-48 bg-white/5" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24 bg-white/5" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20 bg-white/5" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16 bg-white/5" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-16 ml-auto bg-white/5" /></TableCell>
                  </TableRow>
                ))
              ) : (carsData?.length ?? 0) === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                    You haven't listed any vehicles yet.
                  </TableCell>
                </TableRow>
              ) : (
                carsData?.map((car) => (
                  <TableRow key={car.id} className="border-white/5 hover:bg-white/5">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-10 rounded bg-muted overflow-hidden flex-shrink-0">
                          {car.images?.[0] && <img src={car.images[0]} alt="" className="w-full h-full object-cover" />}
                        </div>
                        <div>
                          <div className="font-medium text-white">{car.year} {car.make} {car.model}</div>
                          <div className="text-xs text-muted-foreground">{car.vin || 'No VIN provided'}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-white font-medium">{formatPrice(car.price)}</TableCell>
                    <TableCell>
                      <Badge className={
                        car.status === 'available' ? 'bg-green-500' :
                        car.status === 'sold' ? 'bg-red-500' : 'bg-yellow-500 text-yellow-950'
                      }>
                        {car.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-white">124 / 3</div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/car/${car.id}`}>
                        <Button variant="ghost" size="sm" className="text-primary hover:text-white">
                          View Live
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </main>
    </div>
  );
}
