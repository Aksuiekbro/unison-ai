'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { ApplicationWithDetails, ApplicationStatus } from '@/lib/types';
import { getEmployerApplications, updateApplicationStatus } from '@/lib/applications-mock';

const STATUS_COLORS = {
  applied: 'bg-blue-100 text-blue-800',
  reviewing: 'bg-yellow-100 text-yellow-800',
  interview: 'bg-purple-100 text-purple-800',
  rejected: 'bg-red-100 text-red-800',
  accepted: 'bg-green-100 text-green-800',
};

const STATUS_LABELS = {
  applied: 'Applied',
  reviewing: 'Under Review',
  interview: 'Interview',
  rejected: 'Rejected',
  accepted: 'Accepted',
};

export default function EmployerApplicationsPage() {
  const [applications, setApplications] = useState<ApplicationWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  // Mock employer ID - in real app, get from auth
  const employerId = 'usr_employer_1';

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const fetchedApplications = await getEmployerApplications(employerId);
      setApplications(fetchedApplications);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch applications');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (applicationId: string, newStatus: ApplicationStatus) => {
    try {
      setUpdatingStatus(applicationId);
      await updateApplicationStatus(applicationId, newStatus, employerId);
      
      // Update local state
      setApplications(prev => 
        prev.map(app => 
          app.id === applicationId 
            ? { ...app, status: newStatus }
            : app
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center">
          <div className="text-lg">Loading applications...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Job Applications</h1>
        <p className="text-gray-600 mt-2">Manage applications for your job postings</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {applications.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-500">No applications received yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {applications.map((application) => (
            <Card key={application.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{application.job?.title}</CardTitle>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                      <span>Applied by: {application.candidate?.full_name}</span>
                      <span>•</span>
                      <span>{application.candidate?.email}</span>
                      <span>•</span>
                      <span>Applied: {formatDate(application.applied_date)}</span>
                    </div>
                  </div>
                  <Badge className={STATUS_COLORS[application.status]}>
                    {STATUS_LABELS[application.status]}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {application.message && (
                  <div className="mb-4">
                    <h4 className="font-medium mb-2">Cover Message:</h4>
                    <div className="p-3 bg-gray-50 rounded-md">
                      <p className="text-gray-700 whitespace-pre-wrap">{application.message}</p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center gap-4">
                  <label className="font-medium">Update Status:</label>
                  <Select
                    value={application.status}
                    onValueChange={(value) => handleStatusUpdate(application.id, value as ApplicationStatus)}
                    disabled={updatingStatus === application.id}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="applied">Applied</SelectItem>
                      <SelectItem value="reviewing">Under Review</SelectItem>
                      <SelectItem value="interview">Interview</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="accepted">Accepted</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {updatingStatus === application.id && (
                    <span className="text-sm text-gray-500">Updating...</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}