'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import type { ApplicationWithDetails } from '@/lib/types';
import { getCandidateApplications } from '@/lib/applications-mock';

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
  interview: 'Interview Scheduled',
  rejected: 'Not Selected',
  accepted: 'Offer Received',
};

export default function CandidateApplicationsPage() {
  const [applications, setApplications] = useState<ApplicationWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mock candidate ID - in real app, get from auth
  const candidateId = 'usr_employee_1';

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const fetchedApplications = await getCandidateApplications(candidateId);
      setApplications(fetchedApplications);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch applications');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatSalary = (min?: number, max?: number) => {
    if (!min && !max) return null;
    if (min && max) return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
    if (min) return `$${min.toLocaleString()}+`;
    return `Up to $${max!.toLocaleString()}`;
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center">
          <div className="text-lg">Loading your applications...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">My Applications</h1>
        <p className="text-gray-600 mt-2">Track the status of your job applications</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {applications.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <h3 className="text-lg font-semibold mb-2">No Applications Yet</h3>
            <p className="text-gray-500 mb-4">You haven't applied to any jobs yet. Start browsing to find your next opportunity!</p>
            <Link href="/job-seeker/search">
              <Button>Browse Jobs</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4">
            {applications.map((application) => (
              <Card key={application.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2">{application.job?.title}</CardTitle>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center gap-4">
                          <span className="font-medium">{application.job?.employer?.company_name}</span>
                          {application.job?.location && (
                            <>
                              <span>•</span>
                              <span>{application.job.location}</span>
                            </>
                          )}
                          {formatSalary(application.job?.salary_min, application.job?.salary_max) && (
                            <>
                              <span>•</span>
                              <span>{formatSalary(application.job?.salary_min, application.job?.salary_max)}</span>
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-4">
                          <span>Applied: {formatDate(application.applied_date)}</span>
                          {application.job?.employment_type && (
                            <>
                              <span>•</span>
                              <span className="capitalize">{application.job.employment_type}</span>
                            </>
                          )}
                          {application.job?.experience_level && (
                            <>
                              <span>•</span>
                              <span className="capitalize">{application.job.experience_level} Level</span>
                            </>
                          )}
                        </div>
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
                      <h4 className="font-medium mb-2">Your Application Message:</h4>
                      <div className="p-3 bg-gray-50 rounded-md">
                        <p className="text-gray-700 whitespace-pre-wrap text-sm">{application.message}</p>
                      </div>
                    </div>
                  )}

                  {application.job?.description && (
                    <div>
                      <h4 className="font-medium mb-2">Job Description:</h4>
                      <p className="text-gray-700 text-sm line-clamp-3">{application.job.description}</p>
                    </div>
                  )}
                  
                  <div className="mt-4 flex gap-3">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/job-seeker/jobs/${application.job_id}`}>View Job Details</Link>
                    </Button>
                    {application.status === 'interview' && (
                      <Badge variant="outline" className="bg-purple-50 text-purple-700">
                        🎉 Interview Scheduled!
                      </Badge>
                    )}
                    {application.status === 'accepted' && (
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        🎉 Congratulations! Offer Received
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}