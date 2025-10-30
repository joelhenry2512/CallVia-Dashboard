// app/api/leads/import/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Papa from 'papaparse';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface LeadRow {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone: string;
  [key: string]: any;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const clientId = formData.get('client_id') as string;
    const campaignId = formData.get('campaign_id') as string;

    if (!file || !clientId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Read file content
    const text = await file.text();

    // Parse CSV
    const results = Papa.parse<LeadRow>(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.toLowerCase().trim().replace(/\s+/g, '_'),
    });

    if (results.errors.length > 0) {
      return NextResponse.json(
        { error: 'CSV parsing error', details: results.errors },
        { status: 400 }
      );
    }

    const leads = results.data;

    // Validate leads
    const validLeads = leads.filter((lead) => {
      return lead.phone && lead.phone.trim().length > 0;
    });

    if (validLeads.length === 0) {
      return NextResponse.json(
        { error: 'No valid leads found. Phone number is required.' },
        { status: 400 }
      );
    }

    // Prepare leads for insertion
    const leadsToInsert = validLeads.map((lead) => ({
      client_id: clientId,
      campaign_id: campaignId || null,
      first_name: lead.first_name || null,
      last_name: lead.last_name || null,
      email: lead.email || null,
      phone: normalizePhoneNumber(lead.phone),
      status: 'new',
      custom_fields: Object.keys(lead).reduce((acc, key) => {
        if (!['first_name', 'last_name', 'email', 'phone'].includes(key)) {
          acc[key] = lead[key];
        }
        return acc;
      }, {} as Record<string, any>),
    }));

    // Insert leads in batches
    const batchSize = 100;
    const inserted = [];
    const errors = [];

    for (let i = 0; i < leadsToInsert.length; i += batchSize) {
      const batch = leadsToInsert.slice(i, i + batchSize);
      
      const { data, error } = await supabase
        .from('leads')
        .insert(batch)
        .select();

      if (error) {
        errors.push({ batch: i, error: error.message });
      } else {
        inserted.push(...(data || []));
      }
    }

    // Update campaign stats if campaign_id provided
    if (campaignId) {
      const { data: campaign } = await supabase
        .from('campaigns')
        .select('total_leads, leads_remaining')
        .eq('id', campaignId)
        .single();

      if (campaign) {
        await supabase
          .from('campaigns')
          .update({
            total_leads: (campaign.total_leads || 0) + inserted.length,
            leads_remaining: (campaign.leads_remaining || 0) + inserted.length,
          })
          .eq('id', campaignId);
      }
    }

    return NextResponse.json({
      success: true,
      imported: inserted.length,
      total: leads.length,
      errors: errors.length > 0 ? errors : null,
    });
  } catch (error: any) {
    console.error('Lead import error:', error);
    return NextResponse.json(
      { error: 'Import failed', message: error.message },
      { status: 500 }
    );
  }
}

function normalizePhoneNumber(phone: string): string {
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Add +1 if US number without country code
  if (cleaned.length === 10) {
    return '+1' + cleaned;
  }
  
  // Add + if not present
  if (!phone.startsWith('+')) {
    return '+' + cleaned;
  }
  
  return phone;
}
