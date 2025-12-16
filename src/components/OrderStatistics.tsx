import { Package, TrendingUp, Clock, DollarSign, ShoppingCart, Eye, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { OrderStatistics as OrderStatsType, OrderResponse } from '../services/api';
import { OrderStatisticsSkeleton } from '@/components/ui/order-skeleton';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface OrderStatisticsProps {
  statistics: OrderStatsType | null;
  isLoading: boolean;
  onRefresh: () => void;
  onViewOrder?: (orderId: string) => void;
}

export const OrderStatisticsComponent = ({ 
  statistics, 
  isLoading, 
  onRefresh,
  onViewOrder 
}: OrderStatisticsProps) => {
  if (isLoading) {
    return <OrderStatisticsSkeleton />;
  }

  if (!statistics) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Order Statistics</h3>
          <Button onClick={onRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
        <p className="text-gray-600 mt-2">Unable to load statistics at this time.</p>
      </div>
    );
  }

  const formatCurrency = (amount: number) => `₹${amount.toFixed(2)}`;

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'processing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'shipped':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6 mb-8">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              All time orders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(statistics.totalSpent)}</div>
            <p className="text-xs text-muted-foreground">
              Lifetime spending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.pendingOrders}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting processing
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Order</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(statistics.averageOrderValue)}</div>
            <p className="text-xs text-muted-foreground">
              Per order value
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Spending Chart */}
        {statistics.monthlySpending && statistics.monthlySpending.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Monthly Spending</CardTitle>
              <CardDescription>Your spending pattern over the last 6 months</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={statistics.monthlySpending}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value), 'Amount']}
                    labelFormatter={(label) => `Month: ${label}`}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Recent Orders */}
        {statistics.recentOrders && statistics.recentOrders.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Recent Orders</CardTitle>
                  <CardDescription>Your latest {statistics.recentOrders.length} orders</CardDescription>
                </div>
                <ShoppingCart className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {statistics.recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">#{order.order_number}</span>
                        <Badge className={getStatusColor(order.status)} variant="outline">
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-600">
                        {new Date(order.created_at).toLocaleDateString()} • {formatCurrency(order.total)}
                      </div>
                    </div>
                    {onViewOrder && (
                      <Button
                        onClick={() => onViewOrder(order.id)}
                        variant="ghost"
                        size="sm"
                        className="flex items-center gap-1"
                      >
                        <Eye className="h-3 w-3" />
                        View
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
          <CardDescription>Common tasks and shortcuts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" size="sm" asChild>
              <a href="/">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Continue Shopping
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href="/contact">
                <Package className="h-4 w-4 mr-2" />
                Track Order
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href="/contact">
                <RefreshCw className="h-4 w-4 mr-2" />
                Return/Exchange
              </a>
            </Button>
            <Button variant="outline" size="sm" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Data
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};