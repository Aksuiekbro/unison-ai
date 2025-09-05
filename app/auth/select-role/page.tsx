"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Users, Building2, Search } from "lucide-react";
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from "next/navigation";

export default function SelectRolePage() {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const roles = [
    {
      id: 'employer',
      title: 'Employer',
      description: 'Post jobs, find candidates, and manage your hiring process',
      icon: Building2,
      features: [
        'Post unlimited job listings',
        'Access to candidate pool',
        'Interview scheduling tools',
        'Company profile management'
      ],
      color: 'bg-orange-500'
    },
    {
      id: 'job-seeker',
      title: 'Job Seeker',
      description: 'Search for jobs, apply to positions, and manage your career',
      icon: Search,
      features: [
        'Browse job listings',
        'AI-powered job matching',
        'Profile and portfolio builder',
        'Application tracking'
      ],
      color: 'bg-green-500'
    }
  ];

  const handleRoleUpdate = async (role: string) => {
    setIsUpdating(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { role }
      });

      if (error) {
        console.error('Error updating role:', error);
        return;
      }

      // Redirect based on role
      if (role === 'employer') {
        router.push('/employer/dashboard');
      } else {
        router.push('/job-seeker/dashboard');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Choose Your Role</h1>
          <p className="text-gray-600">Select how you'd like to use the platform</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {roles.map((role) => {
            const IconComponent = role.icon;
            const isSelected = selectedRole === role.id;
            
            return (
              <Card 
                key={role.id} 
                className={`cursor-pointer transition-all duration-200 ${
                  isSelected ? 'ring-2 ring-blue-500 shadow-lg' : 'hover:shadow-md'
                }`}
                onClick={() => setSelectedRole(role.id)}
              >
                <CardHeader className="text-center">
                  <div className={`${role.color} w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4`}>
                    <IconComponent className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-xl">{role.title}</CardTitle>
                  <CardDescription className="text-base">
                    {role.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {role.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-sm">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  
                  <Button
                    className={`w-full ${
                      isSelected ? role.color.replace('bg-', 'bg-') + ' hover:opacity-90' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRoleUpdate(role.id);
                    }}
                    disabled={isUpdating}
                  >
                    {isUpdating && selectedRole === role.id ? 'Setting up...' : `Continue as ${role.title}`}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center mt-6 text-sm text-gray-500">
          You can change your role later in your account settings
        </div>
      </div>
    </div>
  );
}