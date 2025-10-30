'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { formatDateTime, calculateShowRate } from '@/lib/utils';
import { Calendar, CheckCircle, XCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

interface Appointment {
  id: string;
  scheduled_at: string;
  status: string;
  client_confirmed: boolean;
  lead_confirmed: boolean;
  verified_at: string | null;
  notes: string | null;
  leads?: {
    first_name: string;
    last_name: string;
    phone: string;
    email: string | null;
  };
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [verifying, setVerifying] = useState(false);
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchAppointments();
  }, [statusFilter]);

  async function fetchAppointments() {
    try {
      setLoading(true);
      let query = supabase
        .from('appointments')
        .select(`
          *,
          leads (
            first_name,
            last_name,
            phone,
            email
          )
        `)
        .order('scheduled_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setAppointments(data || []);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast.error('Failed to fetch appointments');
    } finally {
      setLoading(false);
    }
  }

  async function verifyAppointment(appointmentId: string, status: 'shown' | 'no-show', notes?: string) {
    try {
      setVerifying(true);
      const response = await axios.post('/api/appointments/verify', {
        appointment_id: appointmentId,
        status,
        verified_by: 'admin',
        notes,
      });

      if (response.data.milestone_achieved) {
        toast.success(`Appointment verified! Milestone ${response.data.milestone_number} achieved!`);
      } else {
        toast.success('Appointment verified successfully');
      }

      fetchAppointments();
      setSelectedAppointment(null);
    } catch (error) {
      console.error('Error verifying appointment:', error);
      toast.error('Failed to verify appointment');
    } finally {
      setVerifying(false);
    }
  }

  const stats = {
    total: appointments.length,
    scheduled: appointments.filter(a => a.status === 'scheduled').length,
    shown: appointments.filter(a => a.status === 'shown').length,
    noShow: appointments.filter(a => a.status === 'no-show').length,
    showRate: calculateShowRate(
      appointments.filter(a => a.status === 'shown').length,
      appointments.filter(a => ['shown', 'no-show'].includes(a.status)).length
    ),
  };

  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'shown', label: 'Shown' },
    { value: 'no-show', label: 'No-Show' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  const upcomingAppointments = appointments.filter(
    a => new Date(a.scheduled_at) > new Date() && a.status === 'scheduled'
  );

  const pastAppointments = appointments.filter(
    a => new Date(a.scheduled_at) <= new Date() || a.status !== 'scheduled'
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Appointments</h1>
        <p className="text-gray-500 mt-1">Manage and verify appointments</p>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-5 gap-4">
        <Card>
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-500">Total</div>
        </Card>
        <Card>
          <div className="text-2xl font-bold text-blue-600">{stats.scheduled}</div>
          <div className="text-sm text-gray-500">Scheduled</div>
        </Card>
        <Card>
          <div className="text-2xl font-bold text-green-600">{stats.shown}</div>
          <div className="text-sm text-gray-500">Shown</div>
        </Card>
        <Card>
          <div className="text-2xl font-bold text-red-600">{stats.noShow}</div>
          <div className="text-sm text-gray-500">No-Show</div>
        </Card>
        <Card>
          <div className="text-2xl font-bold text-purple-600">{stats.showRate}%</div>
          <div className="text-sm text-gray-500">Show Rate</div>
        </Card>
      </div>

      {/* Filter */}
      <Card>
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={statusOptions}
        />
      </Card>

      {/* Upcoming Appointments */}
      {upcomingAppointments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Upcoming Appointments ({upcomingAppointments.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lead</TableHead>
                  <TableHead>Scheduled</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Confirmations</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {upcomingAppointments.map((appointment) => (
                  <TableRow key={appointment.id}>
                    <TableCell className="font-medium">
                      {appointment.leads?.first_name} {appointment.leads?.last_name}
                      <div className="text-xs text-gray-500">{appointment.leads?.phone}</div>
                    </TableCell>
                    <TableCell>{formatDateTime(appointment.scheduled_at)}</TableCell>
                    <TableCell>
                      <Badge status={appointment.status}>{appointment.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {appointment.client_confirmed && (
                          <Badge variant="success">Client ✓</Badge>
                        )}
                        {appointment.lead_confirmed && (
                          <Badge variant="success">Lead ✓</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setSelectedAppointment(appointment)}
                      >
                        Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Past Appointments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Past Appointments ({pastAppointments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading appointments...</div>
          ) : pastAppointments.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No appointments found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lead</TableHead>
                  <TableHead>Scheduled</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Verified</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pastAppointments.map((appointment) => (
                  <TableRow key={appointment.id}>
                    <TableCell className="font-medium">
                      {appointment.leads?.first_name} {appointment.leads?.last_name}
                      <div className="text-xs text-gray-500">{appointment.leads?.phone}</div>
                    </TableCell>
                    <TableCell>{formatDateTime(appointment.scheduled_at)}</TableCell>
                    <TableCell>
                      <Badge status={appointment.status}>{appointment.status}</Badge>
                    </TableCell>
                    <TableCell>
                      {appointment.verified_at ? (
                        <span className="text-xs text-gray-500">
                          {formatDateTime(appointment.verified_at)}
                        </span>
                      ) : (
                        <span className="text-xs text-yellow-600">Pending</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setSelectedAppointment(appointment)}
                      >
                        {appointment.verified_at ? 'View' : 'Verify'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Appointment Detail/Verification Modal */}
      {selectedAppointment && (
        <Modal
          isOpen={!!selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
          title="Appointment Details"
          size="lg"
        >
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Lead Name</label>
                <p className="text-gray-900">
                  {selectedAppointment.leads?.first_name} {selectedAppointment.leads?.last_name}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Phone</label>
                <p className="text-gray-900">{selectedAppointment.leads?.phone}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Scheduled Time</label>
                <p className="text-gray-900">{formatDateTime(selectedAppointment.scheduled_at)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Status</label>
                <div className="mt-1">
                  <Badge status={selectedAppointment.status}>
                    {selectedAppointment.status}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Confirmations
              </label>
              <div className="space-y-2">
                <div className="flex items-center">
                  {selectedAppointment.client_confirmed ? (
                    <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                  ) : (
                    <XCircle className="w-5 h-5 text-gray-400 mr-2" />
                  )}
                  <span>Client Confirmed</span>
                </div>
                <div className="flex items-center">
                  {selectedAppointment.lead_confirmed ? (
                    <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                  ) : (
                    <XCircle className="w-5 h-5 text-gray-400 mr-2" />
                  )}
                  <span>Lead Confirmed</span>
                </div>
              </div>
            </div>

            {!selectedAppointment.verified_at && (
              <div className="border-t pt-4">
                <label className="text-sm font-medium text-gray-700 mb-3 block">
                  Verify Appointment
                </label>
                <div className="flex gap-3">
                  <Button
                    className="flex-1"
                    onClick={() => verifyAppointment(selectedAppointment.id, 'shown')}
                    disabled={verifying}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Mark as Shown
                  </Button>
                  <Button
                    variant="danger"
                    className="flex-1"
                    onClick={() => verifyAppointment(selectedAppointment.id, 'no-show')}
                    disabled={verifying}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Mark as No-Show
                  </Button>
                </div>
              </div>
            )}

            {selectedAppointment.notes && (
              <div className="border-t pt-4">
                <label className="text-sm font-medium text-gray-700">Notes</label>
                <p className="text-gray-900 text-sm mt-1">{selectedAppointment.notes}</p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="secondary" onClick={() => setSelectedAppointment(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
