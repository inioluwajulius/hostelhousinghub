import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, DollarSign, Calendar, Star } from "lucide-react";
import { analyticsAPI } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

export default function EarningsAnalyticsDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [bookingMetrics, setBookingMetrics] = useState<any>(null);

  useEffect(() => {
    if (!user?.id) return;
    loadDashboardData();
  }, [user?.id]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [dashboard, monthlyRevenue, metrics] = await Promise.all([
        analyticsAPI.getHostDashboard(user!.id),
        analyticsAPI.getMonthlyRevenue(user!.id),
        analyticsAPI.getBookingMetrics(user!.id),
      ]);

      setDashboardData(dashboard);
      setBookingMetrics(metrics);

      // Convert monthly revenue to chart data
      const chartData = Object.entries(monthlyRevenue).map(([month, revenue]) => ({
        month,
        revenue,
      }));
      setMonthlyData(chartData);
    } catch (err) {
      console.error("Error loading dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Loading analytics...</p>
        </CardContent>
      </Card>
    );
  }

  const statCards = [
    {
      title: "Total Earnings",
      value: `₦${dashboardData?.totalEarnings?.toLocaleString() || 0}`,
      icon: DollarSign,
      description: "From completed bookings",
    },
    {
      title: "Properties",
      value: dashboardData?.totalProperties || 0,
      icon: Calendar,
      description: `${dashboardData?.activeProperties || 0} active`,
    },
    {
      title: "Total Bookings",
      value: bookingMetrics?.total || 0,
      icon: Calendar,
      description: `${bookingMetrics?.completed || 0} completed`,
    },
    {
      title: "Avg. Rating",
      value: (dashboardData?.propertyAnalytics?.[0]?.avgRating || 0).toFixed(1),
      icon: Star,
      description: "Across all properties",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Card key={idx}>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.description}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts */}
      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList>
          <TabsTrigger value="revenue">Revenue Trend</TabsTrigger>
          <TabsTrigger value="bookings">Booking Status</TabsTrigger>
          <TabsTrigger value="properties">Property Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Revenue</CardTitle>
              <CardDescription>Revenue trend over the last 12 months</CardDescription>
            </CardHeader>
            <CardContent>
              {monthlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => `₦${value?.toLocaleString()}`} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#3b82f6"
                      name="Revenue"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-8">No revenue data available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bookings">
          <Card>
            <CardHeader>
              <CardTitle>Booking Status Distribution</CardTitle>
              <CardDescription>Breakdown of your bookings by status</CardDescription>
            </CardHeader>
            <CardContent>
              {bookingMetrics?.total > 0 ? (
                <div className="space-y-6">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: "Completed", value: bookingMetrics.completed },
                          { name: "Confirmed", value: bookingMetrics.confirmed },
                          { name: "Pending", value: bookingMetrics.pending },
                          { name: "Cancelled", value: bookingMetrics.cancelled },
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {COLORS.map((color, index) => (
                          <Cell key={`cell-${index}`} fill={color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Completed</p>
                      <p className="text-xl font-bold text-green-600">{bookingMetrics.completed}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Confirmed</p>
                      <p className="text-xl font-bold text-blue-600">{bookingMetrics.confirmed}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Pending</p>
                      <p className="text-xl font-bold text-yellow-600">{bookingMetrics.pending}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Cancelled</p>
                      <p className="text-xl font-bold text-red-600">{bookingMetrics.cancelled}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No booking data available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="properties">
          <Card>
            <CardHeader>
              <CardTitle>Property Performance</CardTitle>
              <CardDescription>Performance metrics for each property</CardDescription>
            </CardHeader>
            <CardContent>
              {dashboardData?.propertyAnalytics && dashboardData.propertyAnalytics.length > 0 ? (
                <div className="space-y-4">
                  {dashboardData.propertyAnalytics.map((analytics: any, idx: number) => (
                    <div key={idx} className="p-4 border rounded-lg">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Total Bookings</p>
                          <p className="text-lg font-bold">{analytics.totalBookings}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Completed</p>
                          <p className="text-lg font-bold text-green-600">{analytics.completedBookings}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Total Earnings</p>
                          <p className="text-lg font-bold">₦{analytics.totalEarnings?.toLocaleString() || 0}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Avg. Rating</p>
                          <p className="text-lg font-bold flex items-center gap-1">
                            {analytics.avgRating.toFixed(1)}
                            <span className="text-yellow-500">★</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No property data available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Recent Transactions */}
      {dashboardData?.earnings?.transactions && dashboardData.earnings.transactions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Your latest completed bookings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {dashboardData.earnings.transactions.slice(0, 5).map((transaction: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-muted/50 rounded">
                  <div className="flex-1">
                    <p className="font-medium">{transaction.property?.title || "Property"}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(transaction.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge className="bg-green-600">+₦{transaction.amount?.toLocaleString() || 0}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
