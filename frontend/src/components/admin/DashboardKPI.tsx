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
  Calendar,
  PieChart
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

import { wsService } from '../../modules/client/services/websocket';

export const DashboardKPI: React.FC = () => {
  const [summary, setSummary] = useState<RevenueSummary | null>(null);
  const [hourlyData, setHourlyData] = useState<HourlyRevenuePoint[]>([]);
  const [topProducts, setTopProducts] = useState<TopSellingProduct[]>([]);

  // Period & Date Range Filter State
  const [selectedPeriod, setSelectedPeriod] = useState<string>('TODAY');
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = async (period = selectedPeriod, sDate = startDate, eDate = endDate) => {
    try {
      setLoading(true);
      setError(null);

      const sParam = period === 'CUSTOM' && sDate ? sDate : undefined;
      const eParam = period === 'CUSTOM' && eDate ? eDate : undefined;

      const [sumRes, hourlyRes, topRes] = await Promise.all([
        fetchRevenueSummaryApi(period, sParam, eParam),
        fetchHourlyRevenueApi(period, sParam, eParam),
        fetchTopSellingProductsApi(5, period, sParam, eParam),
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

  const handlePeriodChange = (periodKey: string) => {
    setSelectedPeriod(periodKey);
    if (periodKey !== 'CUSTOM') {
      loadDashboardData(periodKey);
    }
  };

  useEffect(() => {
    loadDashboardData();

    // Đăng ký WebSocket Real-Time Listener tự động cập nhật doanh thu khi có thanh toán thành công
    const unsubAlerts = wsService.subscribe('/topic/admin/tables/alerts', (data) => {
      if (data && (data.type === 'PAYMENT_SUCCESS' || data.type === 'ORDER_CREATED')) {
        loadDashboardData();
      }
    });

    const unsubFloorMap = wsService.subscribe('/topic/tables/floor-map', () => {
      loadDashboardData();
    });

    return () => {
      if (unsubAlerts) unsubAlerts();
      if (unsubFloorMap) unsubFloorMap();
    };
  }, []);

  const formatVND = (num: number) => {
    return new Intl.NumberFormat('vi-VN').format(num) + ' đ';
  };

  const formatYAxis = (val: number) => {
    if (val >= 1_000_000_000) return `${(val / 1_000_000_000).toFixed(1)}B`;
    if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
    if (val >= 1_000) return `${(val / 1_000).toFixed(0)}K`;
    return `${val}`;
  };

  // Custom Chart Tooltip Component
  const CustomChartTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as HourlyRevenuePoint;
      return (
        <div className="bg-slate-900 text-white p-3.5 rounded-xl shadow-xl border border-slate-800 text-xs space-y-1">
          <p className="font-bold text-slate-300">{getTooltipTimeLabel()}: {label}</p>
          <p className="text-orange-400 font-bold text-sm">
            Doanh thu: {formatVND(data.revenue)}
          </p>
          <p className="text-slate-400">Số đơn: {data.orders} đơn hàng</p>
        </div>
      );
    }
    return null;
  };
  const getPeriodBadgeLabel = () => {
    switch (selectedPeriod) {
      case 'TODAY': return 'Hôm nay';
      case 'WEEK': return '7 Ngày qua';
      case 'MONTH': return 'Tháng này';
      case 'YEAR': return 'Năm nay';
      case 'CUSTOM': return 'Tùy chọn';
      default: return 'Hôm nay';
    }
  };

  const getRevenueCardTitle = () => {
    switch (selectedPeriod) {
      case 'TODAY': return 'Doanh thu hôm nay';
      case 'WEEK': return 'Doanh thu 7 ngày qua';
      case 'MONTH': return 'Doanh thu tháng này';
      case 'YEAR': return 'Doanh thu năm nay';
      case 'CUSTOM': return 'Doanh thu kỳ chọn';
      default: return 'Doanh thu hôm nay';
    }
  };

  const getGrowthComparisonLabel = () => {
    switch (selectedPeriod) {
      case 'TODAY': return 'so với hôm qua';
      case 'WEEK': return 'so với tuần trước';
      case 'MONTH': return 'so với tháng trước';
      case 'YEAR': return 'so với năm trước';
      case 'CUSTOM': return 'so với kỳ trước';
      default: return 'so với hôm qua';
    }
  };

  const getChartTitle = () => {
    if (selectedPeriod === 'YEAR') return 'Biểu Đồ Doanh Thu Theo Tháng';
    if (selectedPeriod === 'WEEK' || selectedPeriod === 'MONTH') return 'Biểu Đồ Doanh Thu Theo Ngày';
    if (selectedPeriod === 'CUSTOM') {
      const s = new Date(startDate).getTime();
      const e = new Date(endDate).getTime();
      if ((e - s) > 86400000) return 'Biểu Đồ Doanh Thu Theo Ngày';
    }
    return 'Biểu Đồ Doanh Thu Theo Giờ';
  };

  const getChartDescription = () => {
    if (selectedPeriod === 'YEAR') return 'Theo dõi tổng doanh thu phát sinh theo 12 tháng trong năm';
    if (selectedPeriod === 'WEEK' || selectedPeriod === 'MONTH') return 'Theo dõi tổng doanh thu phát sinh theo từng ngày';
    if (selectedPeriod === 'CUSTOM') {
      const s = new Date(startDate).getTime();
      const e = new Date(endDate).getTime();
      if ((e - s) > 86400000) return 'Theo dõi tổng doanh thu phát sinh theo từng ngày';
    }
    return 'Theo dõi dòng tiền phát sinh theo các khung giờ';
  };

  const getTooltipTimeLabel = () => {
    if (selectedPeriod === 'YEAR') return 'Tháng';
    if (selectedPeriod === 'WEEK' || selectedPeriod === 'MONTH') return 'Ngày';
    if (selectedPeriod === 'CUSTOM') {
      const s = new Date(startDate).getTime();
      const e = new Date(endDate).getTime();
      if ((e - s) > 86400000) return 'Ngày';
    }
    return 'Khung giờ';
  };

  // UI STATE 2: LOADING SKELETON SHIMMER (Matching Layout 1:1)
  if (loading) {
    return (
      <div className="space-y-6 animate-pulse select-none">
        <div className="h-12 bg-slate-200 rounded-xl w-full"></div>
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
      </div>
    );
  }

  // UI STATE 3: ERROR STATE WITH RETRY BUTTON
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-xl text-center space-y-3">
        <AlertTriangle className="w-10 h-10 text-red-500 mx-auto" />
        <h3 className="font-bold text-base">Lỗi Tải Báo Cáo Doanh Thu</h3>
        <p className="text-xs text-red-600 max-w-md mx-auto">{error}</p>
        <button
          type="button"
          onClick={() => loadDashboardData()}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-xs inline-flex items-center gap-2 cursor-pointer transition-colors shadow-xs"
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
      {/* 0. TOP FILTER BAR CONTROL */}
      <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <PieChart className="w-5 h-5 text-orange-600 stroke-[2.2] flex-shrink-0" />
          <h2 className="font-bold text-base text-slate-900 tracking-tight">Dashboard Thống Kê & KPI</h2>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Quick Select Buttons */}
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1 text-xs font-semibold overflow-x-auto max-w-full">
            {[
              { key: 'TODAY', label: 'Hôm nay' },
              { key: 'WEEK', label: '7 Ngày qua' },
              { key: 'MONTH', label: 'Tháng này' },
              { key: 'YEAR', label: 'Năm nay' },
              { key: 'CUSTOM', label: 'Tùy chọn ngày' },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => handlePeriodChange(tab.key)}
                className={`px-3 py-1.5 rounded-md transition-all cursor-pointer whitespace-nowrap ${
                  selectedPeriod === tab.key
                    ? 'bg-white text-orange-600 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Date Picker Range Inputs when CUSTOM is selected */}
          {selectedPeriod === 'CUSTOM' && (
            <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-lg border border-slate-200 text-xs">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2 py-1 bg-white border border-slate-300 rounded text-slate-700 font-medium focus:outline-none focus:border-orange-500 cursor-pointer"
              />
              <span className="text-slate-400 font-bold">➔</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2 py-1 bg-white border border-slate-300 rounded text-slate-700 font-medium focus:outline-none focus:border-orange-500 cursor-pointer"
              />
              <button
                type="button"
                onClick={() => loadDashboardData(selectedPeriod, startDate, endDate)}
                className="px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded cursor-pointer transition-colors shadow-xs"
              >
                Lọc
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 1. TOP 4 KPI CARDS (Grid 4 cột trên Desktop) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Doanh thu */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-2xs space-y-2 hover:border-orange-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">{getRevenueCardTitle()}</span>
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
            <span className="text-slate-400">{getGrowthComparisonLabel()}</span>
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
              <h3 className="font-bold text-sm text-slate-900">{getChartTitle()}</h3>
              <p className="text-[11px] text-slate-400">{getChartDescription()}</p>
            </div>
            <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
              {getPeriodBadgeLabel()}
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
                <YAxis tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} tickFormatter={formatYAxis} />
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
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{getPeriodBadgeLabel()}</span>
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
