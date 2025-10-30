'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { formatDate, formatPhoneNumber } from '@/lib/utils';
import { Search, Filter, Download } from 'lucide-react';
import toast from 'react-hot-toast';

interface Lead {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string;
  status: string;
  created_at: string;
  last_contact_at: string | null;
  campaign_id: string;
  campaigns?: {
    name: string;
  };
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [campaignFilter, setCampaignFilter] = useState('all');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [campaigns, setCampaigns] = useState<Array<{ id: string; name: string }>>([]);
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchLeads();
    fetchCampaigns();
  }, [statusFilter, campaignFilter]);

  async function fetchCampaigns() {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('id, name')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCampaigns(data || []);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    }
  }

  async function fetchLeads() {
    try {
      setLoading(true);
      let query = supabase
        .from('leads')
        .select(`
          *,
          campaigns (
            name
          )
        `)
        .order('created_at', { ascending: false });

      // Apply filters
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (campaignFilter !== 'all') {
        query = query.eq('campaign_id', campaignFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setLeads(data || []);
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast.error('Failed to fetch leads');
    } finally {
      setLoading(false);
    }
  }

  async function updateLeadStatus(leadId: string, newStatus: string) {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ status: newStatus } as any)
        .eq('id', leadId);

      if (error) throw error;

      toast.success('Lead status updated');
      fetchLeads();
      setSelectedLead(null);
    } catch (error) {
      console.error('Error updating lead:', error);
      toast.error('Failed to update lead status');
    }
  }

  // Filter leads by search term
  const filteredLeads = leads.filter(lead => {
    const searchLower = searchTerm.toLowerCase();
    return (
      lead.first_name.toLowerCase().includes(searchLower) ||
      lead.last_name.toLowerCase().includes(searchLower) ||
      lead.phone.includes(searchTerm) ||
      (lead.email && lead.email.toLowerCase().includes(searchLower))
    );
  });

  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'contacted', label: 'Contacted' },
    { value: 'callback', label: 'Callback' },
    { value: 'booked', label: 'Booked' },
    { value: 'shown', label: 'Shown' },
    { value: 'no-show', label: 'No-Show' },
    { value: 'dnc', label: 'Do Not Call' },
  ];

  const campaignOptions = [
    { value: 'all', label: 'All Campaigns' },
    ...campaigns.map(c => ({ value: c.id, label: c.name })),
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Leads</h1>
          <p className="text-gray-500 mt-1">Manage and track all your leads</p>
        </div>
        <Button>
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Search by name, phone, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={statusOptions}
          />
          <Select
            value={campaignFilter}
            onChange={(e) => setCampaignFilter(e.target.value)}
            options={campaignOptions}
          />
        </div>
      </Card>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <div className="text-2xl font-bold text-gray-900">{leads.length}</div>
          <div className="text-sm text-gray-500">Total Leads</div>
        </Card>
        <Card>
          <div className="text-2xl font-bold text-blue-600">
            {leads.filter(l => l.status === 'contacted').length}
          </div>
          <div className="text-sm text-gray-500">Contacted</div>
        </Card>
        <Card>
          <div className="text-2xl font-bold text-purple-600">
            {leads.filter(l => l.status === 'booked').length}
          </div>
          <div className="text-sm text-gray-500">Booked</div>
        </Card>
        <Card>
          <div className="text-2xl font-bold text-green-600">
            {leads.filter(l => l.status === 'shown').length}
          </div>
          <div className="text-sm text-gray-500">Shown</div>
        </Card>
      </div>

      {/* Leads Table */}
      <Card padding={false}>
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading leads...</div>
        ) : filteredLeads.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No leads found</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Campaign</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Contact</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeads.map((lead) => (
                <TableRow
                  key={lead.id}
                  onClick={() => setSelectedLead(lead)}
                >
                  <TableCell className="font-medium">
                    {lead.first_name} {lead.last_name}
                  </TableCell>
                  <TableCell>{formatPhoneNumber(lead.phone)}</TableCell>
                  <TableCell>{lead.email || '-'}</TableCell>
                  <TableCell>
                    {lead.campaigns?.name || 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Badge status={lead.status}>
                      {lead.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {lead.last_contact_at ? formatDate(lead.last_contact_at) : 'Never'}
                  </TableCell>
                  <TableCell>{formatDate(lead.created_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Lead Detail Modal */}
      {selectedLead && (
        <Modal
          isOpen={!!selectedLead}
          onClose={() => setSelectedLead(null)}
          title="Lead Details"
          size="lg"
        >
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">First Name</label>
                <p className="text-gray-900">{selectedLead.first_name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Last Name</label>
                <p className="text-gray-900">{selectedLead.last_name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Phone</label>
                <p className="text-gray-900">{formatPhoneNumber(selectedLead.phone)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Email</label>
                <p className="text-gray-900">{selectedLead.email || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Campaign</label>
                <p className="text-gray-900">{selectedLead.campaigns?.name || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Status</label>
                <div className="mt-1">
                  <Badge status={selectedLead.status}>{selectedLead.status}</Badge>
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Update Status
              </label>
              <div className="flex gap-2 flex-wrap">
                {statusOptions.slice(1).map((status) => (
                  <Button
                    key={status.value}
                    size="sm"
                    variant={selectedLead.status === status.value ? 'primary' : 'secondary'}
                    onClick={() => updateLeadStatus(selectedLead.id, status.value)}
                  >
                    {status.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="secondary" onClick={() => setSelectedLead(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
