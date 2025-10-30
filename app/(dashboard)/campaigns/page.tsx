// app/campaigns/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Upload, Play, Pause, Plus, Trash2, Settings } from 'lucide-react';
import toast from 'react-hot-toast';

interface Campaign {
  id: string;
  name: string;
  status: string;
  total_leads: number;
  leads_called: number;
  leads_remaining: number;
  appointments_set: number;
  appointments_shown: number;
  show_rate: number;
  created_at: string;
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewCampaign, setShowNewCampaign] = useState(false);
  const supabase = createClientComponentClient();

  useEffect(() => {
    loadCampaigns();
  }, []);

  async function loadCampaigns() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userData } = await supabase
        .from('users')
        .select('client_id')
        .eq('id', user.id)
        .single();

      if (!userData) return;

      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('client_id', userData.client_id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setCampaigns(data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error loading campaigns:', error);
      setLoading(false);
    }
  }

  async function toggleCampaignStatus(campaignId: string, currentStatus: string) {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    
    try {
      const { error } = await supabase
        .from('campaigns')
        .update({ status: newStatus })
        .eq('id', campaignId);

      if (error) throw error;

      toast.success(`Campaign ${newStatus === 'active' ? 'started' : 'paused'}`);
      loadCampaigns();
    } catch (error) {
      toast.error('Failed to update campaign');
      console.error(error);
    }
  }

  async function deleteCampaign(campaignId: string) {
    if (!confirm('Are you sure you want to delete this campaign?')) return;

    try {
      const { error } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', campaignId);

      if (error) throw error;

      toast.success('Campaign deleted');
      loadCampaigns();
    } catch (error) {
      toast.error('Failed to delete campaign');
      console.error(error);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Campaigns</h1>
        <button
          onClick={() => setShowNewCampaign(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
        >
          <Plus className="w-5 h-5" />
          New Campaign
        </button>
      </div>

      {/* Campaign List */}
      <div className="space-y-4">
        {campaigns.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Upload className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No campaigns yet</h3>
            <p className="text-gray-500 mb-4">Create your first campaign to start calling leads</p>
            <button
              onClick={() => setShowNewCampaign(true)}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
            >
              Create Campaign
            </button>
          </div>
        ) : (
          campaigns.map((campaign) => (
            <CampaignCard
              key={campaign.id}
              campaign={campaign}
              onToggleStatus={toggleCampaignStatus}
              onDelete={deleteCampaign}
            />
          ))
        )}
      </div>

      {/* New Campaign Modal */}
      {showNewCampaign && (
        <NewCampaignModal
          onClose={() => setShowNewCampaign(false)}
          onCreated={() => {
            setShowNewCampaign(false);
            loadCampaigns();
          }}
        />
      )}
    </div>
  );
}

interface CampaignCardProps {
  campaign: Campaign;
  onToggleStatus: (id: string, status: string) => void;
  onDelete: (id: string) => void;
}

function CampaignCard({ campaign, onToggleStatus, onDelete }: CampaignCardProps) {
  const statusColors = {
    active: 'bg-green-100 text-green-800',
    paused: 'bg-yellow-100 text-yellow-800',
    draft: 'bg-gray-100 text-gray-800',
    completed: 'bg-blue-100 text-blue-800',
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-1">{campaign.name}</h3>
          <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${statusColors[campaign.status as keyof typeof statusColors]}`}>
            {campaign.status}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onToggleStatus(campaign.id, campaign.status)}
            className="p-2 text-gray-600 hover:text-primary-600 transition"
            title={campaign.status === 'active' ? 'Pause' : 'Start'}
          >
            {campaign.status === 'active' ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5" />
            )}
          </button>
          <button
            onClick={() => onDelete(campaign.id)}
            className="p-2 text-gray-600 hover:text-red-600 transition"
            title="Delete"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Stat label="Total Leads" value={campaign.total_leads} />
        <Stat label="Called" value={campaign.leads_called} />
        <Stat label="Remaining" value={campaign.leads_remaining} />
        <Stat label="Appts Set" value={campaign.appointments_set} />
        <Stat label="Show Rate" value={`${campaign.show_rate.toFixed(1)}%`} />
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
          <span>Progress</span>
          <span>{campaign.leads_called} / {campaign.total_leads}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-primary-600 h-2 rounded-full transition-all"
            style={{
              width: `${campaign.total_leads > 0 ? (campaign.leads_called / campaign.total_leads) * 100 : 0}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-lg font-semibold text-gray-900">{value}</p>
    </div>
  );
}

interface NewCampaignModalProps {
  onClose: () => void;
  onCreated: () => void;
}

function NewCampaignModal({ onClose, onCreated }: NewCampaignModalProps) {
  const [name, setName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const supabase = createClientComponentClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!name || !file) {
      toast.error('Please provide a campaign name and CSV file');
      return;
    }

    setUploading(true);

    try {
      // Get client_id
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: userData } = await supabase
        .from('users')
        .select('client_id')
        .eq('id', user.id)
        .single();

      if (!userData) throw new Error('User data not found');

      // Create campaign
      const { data: campaign, error: campaignError } = await supabase
        .from('campaigns')
        .insert({
          client_id: userData.client_id,
          name,
          status: 'draft',
        })
        .select()
        .single();

      if (campaignError) throw campaignError;

      // Upload leads
      const formData = new FormData();
      formData.append('file', file);
      formData.append('client_id', userData.client_id);
      formData.append('campaign_id', campaign.id);

      const response = await fetch('/api/leads/import', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to import leads');

      const result = await response.json();

      toast.success(`Campaign created! Imported ${result.imported} leads`);
      onCreated();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create campaign');
      console.error(error);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">New Campaign</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Campaign Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Q4 2024 - Life Insurance"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Leads (CSV)
            </label>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            />
            <p className="mt-1 text-sm text-gray-500">
              CSV should include: first_name, last_name, email, phone
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              disabled={uploading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
              disabled={uploading}
            >
              {uploading ? 'Creating...' : 'Create Campaign'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
