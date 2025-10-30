// app/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Phone, Calendar, CheckCircle, TrendingUp, DollarSign, Clock } from 'lucide-react';

interface DashboardStats {
  totalCalls: number;
  totalMinutes: number;
  appointmentsSet: number;
  appointmentsShown: number;
  showRate: number;
  totalSpend: number;
  nextMilestone: {
    current: number;
    target: number;
    remaining: number;
  };
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<any[]>([]);
  const supabase = createClientComponentClient();

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      // Get current user's client_id
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userData } = await supabase
        .from('users')
        .select('client_id')
        .eq('id', user.id)
        .single();

      if (!userData) return;

      const clientId = userData.client_id;

      // Fetch stats
      const [callsData, appointmentsData, usageData, clientData] = await Promise.all([
        supabase
          .from('call_logs')
          .select('duration_seconds')
          .eq('client_id', clientId),
        
        supabase
          .from('appointments')
          .select('show_verified')
          .eq('client_id', clientId),
        
        supabase
          .from('usage_records')
          .select('amount')
          .eq('client_id', clientId),
        
        supabase
          .from('clients')
          .select('milestone_interval')
          .eq('id', clientId)
          .single(),
      ]);

      const totalCalls = callsData.data?.length || 0;
      const totalMinutes = Math.round(
        (callsData.data?.reduce((sum, call) => sum + (call.duration_seconds || 0), 0) || 0) / 60
      );
      const appointmentsSet = appointmentsData.data?.length || 0;
      const appointmentsShown = appointmentsData.data?.filter(a => a.show_verified).length || 0;
      const showRate = appointmentsSet > 0 ? (appointmentsShown / appointmentsSet) * 100 : 0;
      const totalSpend = usageData.data?.reduce((sum, record) => sum + parseFloat(record.amount), 0) || 0;

      const milestoneInterval = clientData.data?.milestone_interval || 25;
      const nextMilestoneTarget = Math.ceil(appointmentsShown / milestoneInterval) * milestoneInterval;

      setStats({
        totalCalls,
        totalMinutes,
        appointmentsSet,
        appointmentsShown,
        showRate: Math.round(showRate * 10) / 10,
        totalSpend: Math.round(totalSpend * 100) / 100,
        nextMilestone: {
          current: appointmentsShown,
          target: nextMilestoneTarget,
          remaining: nextMilestoneTarget - appointmentsShown,
        },
      });

      // Load chart data (last 30 days)
      await loadChartData(clientId);

      setLoading(false);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      setLoading(false);
    }
  }

  async function loadChartData(clientId: string) {
    // Get appointments by day for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data } = await supabase
      .from('appointments')
      .select('scheduled_at, show_verified')
      .eq('client_id', clientId)
      .gte('scheduled_at', thirtyDaysAgo.toISOString());

    // Group by day
    const grouped = (data || []).reduce((acc, apt) => {
      const date = new Date(apt.scheduled_at).toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { date, set: 0, shown: 0 };
      }
      acc[date].set++;
      if (apt.show_verified) {
        acc[date].shown++;
      }
      return acc;
    }, {} as Record<string, any>);

    setChartData(Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date)));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">No data available</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <StatCard
          icon={<Phone className="w-6 h-6" />}
          title="Total Calls"
          value={stats.totalCalls.toLocaleString()}
          subtitle={`${stats.totalMinutes.toLocaleString()} minutes`}
          color="blue"
        />
        
        <StatCard
          icon={<Calendar className="w-6 h-6" />}
          title="Appointments Set"
          value={stats.appointmentsSet.toLocaleString()}
          subtitle={`${stats.showRate}% show rate`}
          color="purple"
        />
        
        <StatCard
          icon={<CheckCircle className="w-6 h-6" />}
          title="Appointments Shown"
          value={stats.appointmentsShown.toLocaleString()}
          subtitle={`${stats.nextMilestone.remaining} until next milestone`}
          color="green"
        />
        
        <StatCard
          icon={<TrendingUp className="w-6 h-6" />}
          title="Show Rate"
          value={`${stats.showRate}%`}
          subtitle="Last 30 days"
          color="indigo"
        />
        
        <StatCard
          icon={<DollarSign className="w-6 h-6" />}
          title="Total Spend"
          value={`$${stats.totalSpend.toLocaleString()}`}
          subtitle="Usage + milestones"
          color="emerald"
        />
        
        <StatCard
          icon={<Clock className="w-6 h-6" />}
          title="Next Milestone"
          value={`${stats.nextMilestone.current} / ${stats.nextMilestone.target}`}
          subtitle="Shown appointments"
          color="amber"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Appointments Trend */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Appointments Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="set" stroke="#0ea5e9" name="Set" />
              <Line type="monotone" dataKey="shown" stroke="#22c55e" name="Shown" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Show Rate by Day */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Daily Performance</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="set" fill="#0ea5e9" name="Set" />
              <Bar dataKey="shown" fill="#22c55e" name="Shown" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  subtitle: string;
  color: string;
}

function StatCard({ icon, title, value, subtitle, color }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
    green: 'bg-green-50 text-green-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
          {icon}
        </div>
      </div>
      <h3 className="text-sm font-medium text-gray-500 mb-1">{title}</h3>
      <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
      <p className="text-sm text-gray-500">{subtitle}</p>
    </div>
  );
}
