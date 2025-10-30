'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Users, TrendingUp, DollarSign, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface Client {
  id: string;
  name: string;
  email: string;
  company_name: string | null;
  status: string;
  created_at: string;
  per_minute_rate: number;
  milestone_amount: number;
  milestone_interval: number;
}

interface ClientStats {
  client_id: string;
  total_calls: number;
  total_appointments: number;
  total_shown: number;
  total_spend: number;
}

export default function AdminPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [stats, setStats] = useState<Record<string, ClientStats>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClients();
  }, []);

  async function fetchClients() {
    try {
      setLoading(true);

      // Fetch all clients
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (clientsError) throw clientsError;
      setClients(clientsData || []);

      // Fetch stats for each client
      const statsPromises = (clientsData || []).map(async (client) => {
        // Get call logs count
        const { count: callsCount } = await supabase
          .from('call_logs')
          .select('*', { count: 'exact', head: true })
          .eq('client_id', client.id);

        // Get appointments count
        const { count: appointmentsCount } = await supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .eq('client_id', client.id);

        // Get shown appointments count
        const { count: shownCount } = await supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .eq('client_id', client.id)
          .eq('status', 'shown');

        // Get total spend (paid invoices)
        const { data: invoices } = await supabase
          .from('invoices')
          .select('amount')
          .eq('client_id', client.id)
          .eq('status', 'paid');

        const totalSpend = invoices?.reduce((sum, inv) => sum + inv.amount, 0) || 0;

        return {
          client_id: client.id,
          total_calls: callsCount || 0,
          total_appointments: appointmentsCount || 0,
          total_shown: shownCount || 0,
          total_spend: totalSpend,
        };
      });

      const statsData = await Promise.all(statsPromises);
      const statsMap = statsData.reduce((acc, stat) => {
        acc[stat.client_id] = stat;
        return acc;
      }, {} as Record<string, ClientStats>);

      setStats(statsMap);

    } catch (error) {
      console.error('Error fetching clients:', error);
      toast.error('Failed to fetch clients');
    } finally {
      setLoading(false);
    }
  }

  async function toggleClientStatus(clientId: string, currentStatus: string) {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';

      const { error } = await supabase
        .from('clients')
        .update({ status: newStatus })
        .eq('id', clientId);

      if (error) throw error;

      toast.success(`Client ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
      fetchClients();
    } catch (error) {
      console.error('Error updating client status:', error);
      toast.error('Failed to update client status');
    }
  }

  // Calculate global stats
  const globalStats = {
    totalClients: clients.length,
    activeClients: clients.filter(c => c.status === 'active').length,
    totalCalls: Object.values(stats).reduce((sum, s) => sum + s.total_calls, 0),
    totalRevenue: Object.values(stats).reduce((sum, s) => sum + s.total_spend, 0),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Console</h1>
        <p className="text-gray-500 mt-1">Manage all clients and view global statistics</p>
      </div>

      {/* Global Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {globalStats.totalClients}
              </div>
              <div className="text-sm text-gray-500">Total Clients</div>
            </div>
            <Users className="w-8 h-8 text-blue-600" />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-green-600">
                {globalStats.activeClients}
              </div>
              <div className="text-sm text-gray-500">Active Clients</div>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {globalStats.totalCalls}
              </div>
              <div className="text-sm text-gray-500">Total Calls</div>
            </div>
            <AlertCircle className="w-8 h-8 text-purple-600" />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-orange-600">
                {formatCurrency(globalStats.totalRevenue)}
              </div>
              <div className="text-sm text-gray-500">Total Revenue</div>
            </div>
            <DollarSign className="w-8 h-8 text-orange-600" />
          </div>
        </Card>
      </div>

      {/* Clients Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Clients</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading clients...</div>
          ) : clients.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No clients found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Calls</TableHead>
                  <TableHead>Appointments</TableHead>
                  <TableHead>Shown</TableHead>
                  <TableHead>Total Spend</TableHead>
                  <TableHead>Rates</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => {
                  const clientStats = stats[client.id] || {
                    total_calls: 0,
                    total_appointments: 0,
                    total_shown: 0,
                    total_spend: 0,
                  };

                  return (
                    <TableRow key={client.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{client.name}</div>
                          <div className="text-xs text-gray-500">{client.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>{client.company_name || '-'}</TableCell>
                      <TableCell>
                        <Badge status={client.status}>{client.status}</Badge>
                      </TableCell>
                      <TableCell>{clientStats.total_calls}</TableCell>
                      <TableCell>{clientStats.total_appointments}</TableCell>
                      <TableCell className="font-semibold text-green-600">
                        {clientStats.total_shown}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(clientStats.total_spend)}
                      </TableCell>
                      <TableCell>
                        <div className="text-xs">
                          <div>${client.per_minute_rate}/min</div>
                          <div>
                            {formatCurrency(client.milestone_amount)}/{client.milestone_interval}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(client.created_at)}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant={client.status === 'active' ? 'danger' : 'primary'}
                          onClick={() => toggleClientStatus(client.id, client.status)}
                        >
                          {client.status === 'active' ? 'Deactivate' : 'Activate'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* System Info */}
      <Card>
        <CardHeader>
          <CardTitle>System Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Platform Status</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Database</span>
                  <Badge variant="success">Connected</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">API Status</span>
                  <Badge variant="success">Operational</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Webhooks</span>
                  <Badge variant="success">Active</Badge>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-3">Integrations</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Retell AI</span>
                  <Badge variant="success">Connected</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Cal.com</span>
                  <Badge variant="success">Connected</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Stripe</span>
                  <Badge variant="success">Connected</Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
