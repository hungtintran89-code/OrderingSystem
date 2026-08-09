import React, { useState, useEffect } from 'react';
import {
  RevenueSummary,
  HourlyRevenuePoint,
  TopSellingProduct
} from '../../types/admin';
import {
  fetchRevenueSummaryApi,
  fetchHourlyRevenueApi,
  fetchTopSellingProductsApi
} from '../../api/adminApi';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingBag,
  Users,
  CreditCard,
  RefreshCw,
  AlertTriangle,
  Award,
  Calendar
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

export const DashboardKPI: React.FC = () => {
  const [summary, setSummary] = useState<RevenueSummary | null>(null);
  const [hourlyData, setHourlyData] = useState<HourlyRevenuePoint[]>([]);
  const [topProducts, setTopProducts] = useState<TopSellingProduct[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [sumRes, hourlyRes, topRes] = await Promise.all([
        fetchRevenueSummaryApi(),
        fetchHourlyRevenueApi(),
        fetchTopSellingProductsApi(5),
      ]);
      setSummary(sumRes);
      setHourlyData(hourlyRes);
      setTopProducts(topRes);
    } catch (err) {
      setError('Không thể kết nối API Báo cáo Doanh Thu. Vui lòng bấm thử lại.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const formatVND = (num: number) => {
    return new Intl.NumberFormat('vi-VN').format(num) + ' đ';
  };

  // Custom Chart Tooltip Component
  const CustomChartTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as HourlyRevenuePoint;
      return (
        <div className="bg-slate-900 text-white p-3 rounded-lg shadow-xl border border-slate-800 text-xs space-y-1">
          <p className="font-bold text-slate-300">Khung giờ: {label}</p>
          <p className="text-orange-400 font-semibold">
            Doanh thu: {formatVND(data.revenue)}
          </p>
          <p className="text-slate-400">Số đơn: {data.orders} đơn hàng</p>
        </div>
      );
    }
    return null;
  };

  // UI STATE 2: LOADING SKELETON SHIMMER (Matching Layout 1:1)
  if (loading) {
    return (
      <div className="space-y-6 animate-pulse select-none">
        {/* KPI Cards Skeleton Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="bg-white p-5 rounded-xl border border-slate-200 space-y-3 shadow-2xs">
              <div className="flex justify-between items-center">
                <div className="h-4 bg-slate-200 rounded w-24"></div>
                <div className="w-8 h-8 bg-slate-200 rounded-lg"></div>
              </div>
              <div className="h-8 bg-slate-200 rounded w-36"></div>
              <div className="h-3 bg-slate-200 rounded w-20"></div>
            </div>
          ))}
        </div>

        {/* Chart Skeleton */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4 shadow-2xs">
          <div className="h-5 bg-slate-200 rounded w-48"></div>
          <div className="h-64 bg-slate-100 rounded-xl w-full"></div>
        </div>
      </div>
    );
  }

  // UI STATE 3: ERROR ALERT WITH RETRY
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center space-y-3 max-w-lg mx-auto my-6">
        <AlertTriangle className="w-8 h-8 text-red-600 mx-auto" />
        <h3 className="text-sm font-bold text-red-900">{error}</h3>
        <button
          onClick={loadDashboardData}
          className="h-9 px-4 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Thử lại kết nối</span>
        </button>
      </div>
    );
  }

  // UI STATE 1: NORMAL DATA STATE
  return (
    <div className="space-y-6 font-sans">
      {/* 1. TOP 4 KPI CARDS (Grid 4 cột trên Desktop) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Doanh thu hôm nay */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-2xs space-y-2 hover:border-orange-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Doanh thu hôm nay</span>
            <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {formatVND(summary?.totalRevenue || 0)}
          </p>
          <div className="flex items-center gap-1.5 text-[11px]">
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold">
              <TrendingUp className="w-3 h-3" /> +{summary?.revenueGrowthPercent}%
            </span>
            <span className="text-slate-400">so với hôm qua</span>
          </div>
        </div>

        {/* Card 2: Số lượng đơn hàng */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-2xs space-y-2 hover:border-orange-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Số lượng đơn hàng</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {summary?.totalOrders} Đơn
          </p>
          <p className="text-[11px] text-slate-500">
            Đang phục vụ: <strong className="text-orange-600 font-semibold">{summary?.activeServingOrders} bàn</strong>
          </p>
        </div>

        {/* Card 3: Tỉ lệ lấp đầy bàn */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-2xs space-y-2 hover:border-orange-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Tỉ lệ lấp đầy bàn</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {summary?.occupancyRate}%
          </p>
          {/* Progress bar */}
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-orange-600 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${summary?.occupancyRate}%` }}
            ></div>
          </div>
        </div>

        {/* Card 4: Giá trị trung bình/đơn */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-2xs space-y-2 hover:border-orange-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Giá trị TB / Đơn (AOV)</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {formatVND(summary?.avgOrderValue || 0)}
          </p>
          <p className="text-[11px] text-slate-400">Tính trên các đơn đã hoàn tất</p>
        </div>
      </div>

      {/* 2. REVENUE ANALYTICS CHART & TOP SELLING PRODUCTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Recharts AreaChart (2 cols) */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Biểu Đồ Doanh Thu Theo Giờ</h3>
              <p className="text-[11px] text-slate-400">Theo dõi dòng tiền phát sinh từ 08:00 đến 22:00</p>
            </div>
            <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
              Hôm nay
            </span>
          </div>

          <div className="h-64 sm:h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EA580C" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#EA580C" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="hour" tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} tickFormatter={(v) => `${v / 1000000}M`} />
                <Tooltip content={<CustomChartTooltip />} />
                <Area type="monotone" dataKey="revenue" stroke="#EA580C" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Top 5 Selling Products Widget (1 col) */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-orange-600" />
                <h3 className="font-bold text-sm text-slate-900">Top 5 Món Bán Chạy</h3>
              </div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Hôm nay</span>
            </div>

            <div className="divide-y divide-slate-100 mt-2">
              {topProducts.map((item) => (
                <div key={item.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 font-bold text-[10px] flex items-center justify-center flex-shrink-0">
                      #{item.rank}
                    </span>
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-9 h-9 rounded-lg object-cover border border-slate-200 flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-900 truncate leading-tight">{item.name}</p>
                      <p className="text-[10px] text-slate-400 truncate">{item.category}</p>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-bold text-slate-900">{item.quantitySold} phần</p>
                    <p className="text-[10px] text-orange-600 font-semibold">{formatVND(item.totalRevenue)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
