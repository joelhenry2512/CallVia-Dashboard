'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { formatCurrency, formatDate } from '@/lib/utils';
import { DollarSign, TrendingUp, CreditCard, FileText, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Invoice {
  id: string;
  stripe_invoice_id: string;
  type: string;
  amount: number;
  status: string;
  billing_period_start: string | null;
  billing_period_end: string | null;
  due_date: string | null;
  paid_at: string | null;
  created_at: string;
}

interface Milestone {
  id: string;
  milestone_number: number;
  appointments_count: number;
  amount: number;
  status: string;
  achieved_at: string;
  paid_at: string | null;
}

interface UsageRecord {
  id: string;
  minutes: number;
  amount: number;
  billing_period: string;
  billed: boolean;
  created_at: string;
}

export default function BillingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [usageRecords, setUsageRecords] = useState<UsageRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBillingData();
  }, []);

  async function fetchBillingData() {
    try {
      setLoading(true);

      // Fetch invoices
      const { data: invoicesData, error: invoicesError } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (invoicesError) throw invoicesError;
      setInvoices(invoicesData || []);

      // Fetch milestones
      const { data: milestonesData, error: milestonesError } = await supabase
        .from('milestones')
        .select('*')
        .order('milestone_number', { ascending: false })
        .limit(10);

      if (milestonesError) throw milestonesError;
      setMilestones(milestonesData || []);

      // Fetch usage records for current billing period
      const currentPeriod = new Date().toISOString().slice(0, 7); // YYYY-MM
      const { data: usageData, error: usageError } = await supabase
        .from('usage_records')
        .select('*')
        .eq('billing_period', currentPeriod)
        .order('created_at', { ascending: false });

      if (usageError) throw usageError;
      setUsageRecords(usageData || []);

    } catch (error) {
      console.error('Error fetching billing data:', error);
      toast.error('Failed to fetch billing data');
    } finally {
      setLoading(false);
    }
  }

  // Calculate stats
  const totalSpend = invoices
    .filter(i => i.status === 'paid')
    .reduce((sum, i) => sum + i.amount, 0);

  const currentPeriodUsage = usageRecords.reduce((sum, r) => sum + r.amount, 0);
  const currentPeriodMinutes = usageRecords.reduce((sum, r) => sum + r.minutes, 0);

  const nextMilestone = milestones.find(m => m.status === 'pending');
  const completedMilestones = milestones.filter(m => m.status === 'paid').length;

  // Prepare chart data
  const chartData = invoices
    .slice(0, 12)
    .reverse()
    .map(invoice => ({
      date: formatDate(invoice.created_at),
      amount: invoice.amount,
    }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Billing</h1>
          <p className="text-gray-500 mt-1">Track invoices, usage, and milestones</p>
        </div>
        <Button>
          <Download className="w-4 h-4 mr-2" />
          Download Statement
        </Button>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(totalSpend)}
              </div>
              <div className="text-sm text-gray-500">Total Spend</div>
            </div>
            <DollarSign className="w-8 h-8 text-blue-600" />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(currentPeriodUsage)}
              </div>
              <div className="text-sm text-gray-500">Current Period</div>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {currentPeriodMinutes}
              </div>
              <div className="text-sm text-gray-500">Minutes Used</div>
            </div>
            <CreditCard className="w-8 h-8 text-purple-600" />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {completedMilestones}
              </div>
              <div className="text-sm text-gray-500">Milestones Paid</div>
            </div>
            <FileText className="w-8 h-8 text-orange-600" />
          </div>
        </Card>
      </div>

      {/* Next Milestone Progress */}
      {nextMilestone && (
        <Card>
          <CardHeader>
            <CardTitle>Next Milestone Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">
                  Milestone {nextMilestone.milestone_number}
                </span>
                <span className="font-medium">
                  {nextMilestone.appointments_count} / 25 appointments
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className="bg-blue-600 h-4 rounded-full transition-all"
                  style={{
                    width: `${(nextMilestone.appointments_count / 25) * 100}%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Amount: {formatCurrency(nextMilestone.amount)}</span>
                <span>
                  {25 - nextMilestone.appointments_count} appointments remaining
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Spending Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Spending Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip
                  formatter={(value) => formatCurrency(Number(value))}
                />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={{ fill: '#2563eb' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Recent Invoices
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading invoices...</div>
          ) : invoices.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No invoices found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Billing Period</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Paid Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-mono text-xs">
                      {invoice.stripe_invoice_id.slice(-8)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={invoice.type === 'milestone' ? 'info' : 'default'}>
                        {invoice.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(invoice.amount)}
                    </TableCell>
                    <TableCell>
                      <Badge status={invoice.status}>{invoice.status}</Badge>
                    </TableCell>
                    <TableCell>
                      {invoice.billing_period_start && invoice.billing_period_end
                        ? `${formatDate(invoice.billing_period_start)} - ${formatDate(invoice.billing_period_end)}`
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {invoice.due_date ? formatDate(invoice.due_date) : '-'}
                    </TableCell>
                    <TableCell>
                      {invoice.paid_at ? formatDate(invoice.paid_at) : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Milestones Table */}
      <Card>
        <CardHeader>
          <CardTitle>Milestone History</CardTitle>
        </CardHeader>
        <CardContent>
          {milestones.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No milestones achieved yet
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Milestone</TableHead>
                  <TableHead>Appointments</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Achieved</TableHead>
                  <TableHead>Paid</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {milestones.map((milestone) => (
                  <TableRow key={milestone.id}>
                    <TableCell className="font-semibold">
                      Milestone {milestone.milestone_number}
                    </TableCell>
                    <TableCell>{milestone.appointments_count}</TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(milestone.amount)}
                    </TableCell>
                    <TableCell>
                      <Badge status={milestone.status}>{milestone.status}</Badge>
                    </TableCell>
                    <TableCell>{formatDate(milestone.achieved_at)}</TableCell>
                    <TableCell>
                      {milestone.paid_at ? formatDate(milestone.paid_at) : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Current Period Usage */}
      <Card>
        <CardHeader>
          <CardTitle>Current Period Usage (Per-Minute Billing)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-gray-500">Total Minutes</div>
                <div className="text-2xl font-bold text-gray-900">
                  {currentPeriodMinutes}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Rate</div>
                <div className="text-2xl font-bold text-gray-900">$0.20/min</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Total Cost</div>
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency(currentPeriodUsage)}
                </div>
              </div>
            </div>

            {usageRecords.length > 0 && (
              <div className="pt-4 border-t">
                <div className="text-sm text-gray-500 mb-2">Recent Usage</div>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {usageRecords.slice(0, 10).map((record) => (
                    <div
                      key={record.id}
                      className="flex justify-between text-sm py-1"
                    >
                      <span className="text-gray-600">
                        {formatDate(record.created_at)}
                      </span>
                      <span className="font-medium">
                        {record.minutes} min = {formatCurrency(record.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
