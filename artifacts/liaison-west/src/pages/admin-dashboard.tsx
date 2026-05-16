import { AdminLayout } from "@/components/admin-layout";
import { useGetAdminStats, useGetRecentActivity } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Car, ShoppingCart, DollarSign, Activity } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from 'recharts';

export default function AdminDashboard() {
  const { data: stats } = useGetAdminStats();
  const { data: activity } = useGetRecentActivity();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(price);
  };

  // Mock chart data for visualization
  const revenueData = [
    { name: 'Jan', value: 400000 },
    { name: 'Feb', value: 300000 },
    { name: 'Mar', value: 550000 },
    { name: 'Apr', value: 450000 },
    { name: 'May', value: 600000 },
    { name: 'Jun', value: stats?.revenueThisMonth || 800000 },
  ];

  const salesData = [
    { name: 'Jan', sales: 12 },
    { name: 'Feb', sales: 9 },
    { name: 'Mar', sales: 15 },
    { name: 'Apr', sales: 13 },
    { name: 'May', sales: 18 },
    { name: 'Jun', sales: stats?.ordersThisMonth || 24 },
  ];

  return (
    <AdminLayout title="Dashboard Overview">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-card border-white/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
            <DollarSign className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{formatPrice(stats?.totalRevenue || 0)}</div>
            <p className="text-xs text-primary mt-1">+{formatPrice(stats?.revenueThisMonth || 0)} this month</p>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-white/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Orders</CardTitle>
            <ShoppingCart className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats?.totalOrders || 0}</div>
            <p className="text-xs text-primary mt-1">+{stats?.ordersThisMonth || 0} this month</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-white/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Available Inventory</CardTitle>
            <Car className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats?.carsAvailable || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">{stats?.carsSold || 0} sold all time</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-white/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Users</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats?.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">{stats?.activeAgents || 0} active agents</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card className="bg-card border-white/5">
          <CardHeader>
            <CardTitle className="text-lg text-white">Revenue History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                  <XAxis dataKey="name" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value/1000}k`} />
                  <Tooltip 
                    cursor={{fill: '#222'}} 
                    contentStyle={{backgroundColor: '#111', borderColor: '#333', borderRadius: '8px'}} 
                    formatter={(value: number) => [formatPrice(value), 'Revenue']}
                  />
                  <Bar dataKey="value" fill="#ffffff" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-white/5">
          <CardHeader>
            <CardTitle className="text-lg text-white">Vehicle Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                  <XAxis dataKey="name" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{backgroundColor: '#111', borderColor: '#333', borderRadius: '8px'}}
                  />
                  <Line type="monotone" dataKey="sales" stroke="#ffffff" strokeWidth={2} dot={{r: 4, fill: '#fff', strokeWidth: 0}} activeDot={{r: 6}} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="bg-card border-white/5">
        <CardHeader>
          <CardTitle className="text-lg text-white flex items-center gap-2">
            <Activity className="w-5 h-5" /> Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activity && activity.length > 0 ? (
              activity.map((item) => (
                <div key={item.id} className="flex items-start gap-4 p-3 rounded-lg hover:bg-white/5 transition-colors">
                  <div className="w-2 h-2 mt-2 rounded-full bg-primary flex-shrink-0"></div>
                  <div>
                    <p className="text-white text-sm">{item.description}</p>
                    <p className="text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-sm">No recent activity.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
