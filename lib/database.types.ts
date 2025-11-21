export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string
          role: 'employer' | 'job_seeker'
          avatar_url: string | null
          phone: string | null
          location: string | null
          bio: string | null
          skills?: any | null
          experiences?: any | null
          educations?: any | null
          productivity_assessment_completed: boolean
          personality_assessment_completed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name: string
          role: 'employer' | 'job_seeker'
          avatar_url?: string | null
          phone?: string | null
          location?: string | null
          bio?: string | null
          skills?: any | null
          experiences?: any | null
          educations?: any | null
          productivity_assessment_completed?: boolean
          personality_assessment_completed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          role?: 'employer' | 'job_seeker'
          avatar_url?: string | null
          phone?: string | null
          location?: string | null
          bio?: string | null
          skills?: any | null
          experiences?: any | null
          educations?: any | null
          productivity_assessment_completed?: boolean
          personality_assessment_completed?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      companies: {
        Row: {
          id: string
          name: string
          description: string | null
          website: string | null
          logo_url: string | null
          industry: string | null
          size: string | null
          location: string | null
          company_culture: string | null
          benefits: string[] | null
          technologies: string[] | null
          owner_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          website?: string | null
          logo_url?: string | null
          industry?: string | null
          size?: string | null
          location?: string | null
          company_culture?: string | null
          benefits?: string[] | null
          technologies?: string[] | null
          owner_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          website?: string | null
          logo_url?: string | null
          industry?: string | null
          size?: string | null
          location?: string | null
          company_culture?: string | null
          benefits?: string[] | null
          technologies?: string[] | null
          owner_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          user_id: string
          experience_years: number | null
          current_job_title: string | null
          desired_salary_min: number | null
          desired_salary_max: number | null
          preferred_location: string | null
          remote_preference: boolean | null
          resume_url: string | null
          linkedin_url: string | null
          github_url: string | null
          portfolio_url: string | null
          company_culture: string | null
          hiring_preferences: string | null
          personality_test_completed: boolean
          resume_parsed: boolean
          ai_analysis_completed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          experience_years?: number | null
          current_job_title?: string | null
          desired_salary_min?: number | null
          desired_salary_max?: number | null
          preferred_location?: string | null
          remote_preference?: boolean | null
          resume_url?: string | null
          linkedin_url?: string | null
          github_url?: string | null
          portfolio_url?: string | null
          company_culture?: string | null
          hiring_preferences?: string | null
          personality_test_completed?: boolean
          resume_parsed?: boolean
          ai_analysis_completed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          experience_years?: number | null
          current_job_title?: string | null
          desired_salary_min?: number | null
          desired_salary_max?: number | null
          preferred_location?: string | null
          remote_preference?: boolean | null
          resume_url?: string | null
          linkedin_url?: string | null
          github_url?: string | null
          portfolio_url?: string | null
          company_culture?: string | null
          hiring_preferences?: string | null
          personality_test_completed?: boolean
          resume_parsed?: boolean
          ai_analysis_completed?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      test_responses: {
        Row: {
          id: string
          user_id: string
          question_id: string
          response_text: string | null
          response_rating: number | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          question_id: string
          response_text?: string | null
          response_rating?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          question_id?: string
          response_text?: string | null
          response_rating?: number | null
          created_at?: string
        }
      }
      skills: {
        Row: {
          id: string
          name: string
          category: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          category?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          category?: string | null
          created_at?: string
        }
      }
      user_skills: {
        Row: {
          id: string
          user_id: string
          skill_id: string
          proficiency_level: number | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          skill_id: string
          proficiency_level?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          skill_id?: string
          proficiency_level?: number | null
          created_at?: string
        }
      }
      jobs: {
        Row: {
          id: string
          title: string
          description: string
          requirements: string | null
          responsibilities: string | null
          company_id: string
          job_type: 'full_time' | 'part_time' | 'contract' | 'internship'
          experience_level: 'entry' | 'junior' | 'mid' | 'senior' | 'executive'
          salary_min: number | null
          salary_max: number | null
          currency: string
          location: string | null
          remote_allowed: boolean
          status: 'draft' | 'published' | 'closed' | 'cancelled'
          posted_at: string | null
          expires_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          requirements?: string | null
          responsibilities?: string | null
          company_id: string
          job_type?: 'full_time' | 'part_time' | 'contract' | 'internship'
          experience_level?: 'entry' | 'junior' | 'mid' | 'senior' | 'executive'
          salary_min?: number | null
          salary_max?: number | null
          currency?: string
          location?: string | null
          remote_allowed?: boolean
          status?: 'draft' | 'published' | 'closed' | 'cancelled'
          posted_at?: string | null
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          requirements?: string | null
          responsibilities?: string | null
          company_id?: string
          job_type?: 'full_time' | 'part_time' | 'contract' | 'internship'
          experience_level?: 'entry' | 'junior' | 'mid' | 'senior' | 'executive'
          salary_min?: number | null
          salary_max?: number | null
          currency?: string
          location?: string | null
          remote_allowed?: boolean
          status?: 'draft' | 'published' | 'closed' | 'cancelled'
          posted_at?: string | null
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      job_skills: {
        Row: {
          id: string
          job_id: string
          skill_id: string
          required: boolean
          created_at: string
        }
        Insert: {
          id?: string
          job_id: string
          skill_id: string
          required?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          job_id?: string
          skill_id?: string
          required?: boolean
          created_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          user_id: string
          experience_years: number | null
          current_job_title: string | null
          desired_salary_min: number | null
          desired_salary_max: number | null
          preferred_location: string | null
          remote_preference: boolean | null
          resume_url: string | null
          linkedin_url: string | null
          github_url: string | null
          portfolio_url: string | null
          company_culture: string | null
          hiring_preferences: string | null
          personality_test_completed: boolean
          resume_parsed: boolean
          ai_analysis_completed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          experience_years?: number | null
          current_job_title?: string | null
          desired_salary_min?: number | null
          desired_salary_max?: number | null
          preferred_location?: string | null
          remote_preference?: boolean | null
          resume_url?: string | null
          linkedin_url?: string | null
          github_url?: string | null
          portfolio_url?: string | null
          company_culture?: string | null
          hiring_preferences?: string | null
          personality_test_completed?: boolean
          resume_parsed?: boolean
          ai_analysis_completed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          experience_years?: number | null
          current_job_title?: string | null
          desired_salary_min?: number | null
          desired_salary_max?: number | null
          preferred_location?: string | null
          remote_preference?: boolean | null
          resume_url?: string | null
          linkedin_url?: string | null
          github_url?: string | null
          portfolio_url?: string | null
          company_culture?: string | null
          hiring_preferences?: string | null
          personality_test_completed?: boolean
          resume_parsed?: boolean
          ai_analysis_completed?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      experiences: {
        Row: {
          id: string
          profile_id: string
          job_title: string
          company_name: string
          start_date: string
          end_date: string | null
          is_current: boolean
          description: string | null
          achievements: string | null
          created_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          job_title: string
          company_name: string
          start_date: string
          end_date?: string | null
          is_current?: boolean
          description?: string | null
          achievements?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          job_title?: string
          company_name?: string
          start_date?: string
          end_date?: string | null
          is_current?: boolean
          description?: string | null
          achievements?: string | null
          created_at?: string
        }
      }
      educations: {
        Row: {
          id: string
          profile_id: string
          institution_name: string
          degree: string
          field_of_study: string | null
          start_date: string
          end_date: string | null
          is_current: boolean
          gpa: string | null
          achievements: string | null
          created_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          institution_name: string
          degree: string
          field_of_study?: string | null
          start_date: string
          end_date?: string | null
          is_current?: boolean
          gpa?: string | null
          achievements?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          institution_name?: string
          degree?: string
          field_of_study?: string | null
          start_date?: string
          end_date?: string | null
          is_current?: boolean
          gpa?: string | null
          achievements?: string | null
          created_at?: string
        }
      }
      questionnaires: {
        Row: {
          id: string
          question_text: string
          question_type: string
          category: string | null
          is_active: boolean
          order_index: number | null
          created_at: string
        }
        Insert: {
          id?: string
          question_text: string
          question_type?: string
          category?: string | null
          is_active?: boolean
          order_index?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          question_text?: string
          question_type?: string
          category?: string | null
          is_active?: boolean
          order_index?: number | null
          created_at?: string
        }
      }
      work_experiences: {
        Row: {
          id: string
          user_id: string
          company_name: string
          company_activities: string | null
          position: string
          start_date: string
          end_date: string | null
          is_current: boolean
          work_duration: string | null
          reason_for_leaving: string | null
          functions_performed: string | null
          work_products: string | null
          result_measurement: string | null
          product_timeline: string | null
          team_comparison_score: number | null
          workload_change_over_time: string | null
          responsibility_evolution: string | null
          key_achievements: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          company_name: string
          company_activities?: string | null
          position: string
          start_date: string
          end_date?: string | null
          is_current?: boolean
          work_duration?: string | null
          reason_for_leaving?: string | null
          functions_performed?: string | null
          work_products?: string | null
          result_measurement?: string | null
          product_timeline?: string | null
          team_comparison_score?: number | null
          workload_change_over_time?: string | null
          responsibility_evolution?: string | null
          key_achievements?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          company_name?: string
          company_activities?: string | null
          position?: string
          start_date?: string
          end_date?: string | null
          is_current?: boolean
          work_duration?: string | null
          reason_for_leaving?: string | null
          functions_performed?: string | null
          work_products?: string | null
          result_measurement?: string | null
          product_timeline?: string | null
          team_comparison_score?: number | null
          workload_change_over_time?: string | null
          responsibility_evolution?: string | null
          key_achievements?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      knowledge_assessments: {
        Row: {
          id: string
          user_id: string
          recent_learning_activities: string | null
          professional_development: string | null
          future_learning_goals: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          recent_learning_activities?: string | null
          professional_development?: string | null
          future_learning_goals?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          recent_learning_activities?: string | null
          professional_development?: string | null
          future_learning_goals?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      personality_analysis: {
        Row: {
          id: string
          user_id: string
          problem_solving_style: string | null
          initiative_level: string | null
          work_preference: string | null
          motivational_factors: string | null
          growth_areas: string | null
          communication_style: string | null
          leadership_potential: string | null
          analytical_score: number | null
          creative_score: number | null
          leadership_score: number | null
          teamwork_score: number | null
          trait_scores: any | null
          ai_confidence_score: number | null
          analysis_version: string | null
          status: 'queued' | 'processing' | 'completed' | 'failed'
          queued_at: string
          processed_at: string | null
          error_message: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          problem_solving_style?: string | null
          initiative_level?: string | null
          work_preference?: string | null
          motivational_factors?: string | null
          growth_areas?: string | null
          communication_style?: string | null
          leadership_potential?: string | null
          analytical_score?: number | null
          creative_score?: number | null
          leadership_score?: number | null
          teamwork_score?: number | null
          trait_scores?: any | null
          ai_confidence_score?: number | null
          analysis_version?: string | null
          status?: 'queued' | 'processing' | 'completed' | 'failed'
          queued_at?: string
          processed_at?: string | null
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          problem_solving_style?: string | null
          initiative_level?: string | null
          work_preference?: string | null
          motivational_factors?: string | null
          growth_areas?: string | null
          communication_style?: string | null
          leadership_potential?: string | null
          analytical_score?: number | null
          creative_score?: number | null
          leadership_score?: number | null
          teamwork_score?: number | null
          trait_scores?: any | null
          ai_confidence_score?: number | null
          analysis_version?: string | null
          status?: 'queued' | 'processing' | 'completed' | 'failed'
          queued_at?: string
          processed_at?: string | null
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      productivity_assessments: {
        Row: {
          id: string
          user_id: string
          citizenship: string | null
          residence_location: string | null
          family_status: string | null
          has_children: boolean | null
          living_situation: string | null
          actual_address: string | null
          financial_obligations: string | null
          legal_issues: string | null
          chronic_illnesses: string | null
          minimum_salary_requirement: number | null
          role_type: 'manager' | 'specialist' | null
          motivation_level: number | null
          iq_test_score: number | null
          personality_test_score: number | null
          leadership_test_score: number | null
          overall_productivity_score: number | null
          assessor_notes: string | null
          probation_recommendation: 'yes' | 'no' | 'never_consider' | null
          planned_start_date: string | null
          assessment_version: string
          completed_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          citizenship?: string | null
          residence_location?: string | null
          family_status?: string | null
          has_children?: boolean | null
          living_situation?: string | null
          actual_address?: string | null
          financial_obligations?: string | null
          legal_issues?: string | null
          chronic_illnesses?: string | null
          minimum_salary_requirement?: number | null
          role_type?: 'manager' | 'specialist' | null
          motivation_level?: number | null
          iq_test_score?: number | null
          personality_test_score?: number | null
          leadership_test_score?: number | null
          overall_productivity_score?: number | null
          assessor_notes?: string | null
          probation_recommendation?: 'yes' | 'no' | 'never_consider' | null
          planned_start_date?: string | null
          assessment_version?: string
          completed_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          citizenship?: string | null
          residence_location?: string | null
          family_status?: string | null
          has_children?: boolean | null
          living_situation?: string | null
          actual_address?: string | null
          financial_obligations?: string | null
          legal_issues?: string | null
          chronic_illnesses?: string | null
          minimum_salary_requirement?: number | null
          role_type?: 'manager' | 'specialist' | null
          motivation_level?: number | null
          iq_test_score?: number | null
          personality_test_score?: number | null
          leadership_test_score?: number | null
          overall_productivity_score?: number | null
          assessor_notes?: string | null
          probation_recommendation?: 'yes' | 'no' | 'never_consider' | null
          planned_start_date?: string | null
          assessment_version?: string
          completed_at?: string
          created_at?: string
          updated_at?: string
        }
      }
      shared_reports: {
        Row: {
          id: string
          user_id: string
          assessment_id: string
          token: string
          expires_at: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          assessment_id: string
          token: string
          expires_at: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          assessment_id?: string
          token?: string
          expires_at?: string
          created_at?: string
        }
      }
      match_scores: {
        Row: {
          id: string
          job_id: string
          candidate_id: string
          overall_score: number
          skills_match_score: number | null
          experience_match_score: number | null
          culture_fit_score: number | null
          personality_match_score: number | null
          match_explanation: string | null
          strengths: string | null
          potential_concerns: string | null
          ai_confidence_score: number | null
          analysis_version: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          job_id: string
          candidate_id: string
          overall_score: number
          skills_match_score?: number | null
          experience_match_score?: number | null
          culture_fit_score?: number | null
          personality_match_score?: number | null
          match_explanation?: string | null
          strengths?: string | null
          potential_concerns?: string | null
          ai_confidence_score?: number | null
          analysis_version?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          job_id?: string
          candidate_id?: string
          overall_score?: number
          skills_match_score?: number | null
          experience_match_score?: number | null
          culture_fit_score?: number | null
          personality_match_score?: number | null
          match_explanation?: string | null
          strengths?: string | null
          potential_concerns?: string | null
          ai_confidence_score?: number | null
          analysis_version?: string
          created_at?: string
          updated_at?: string
        }
      }
      resume_parsing_results: {
        Row: {
          id: string
          user_id: string
          original_filename: string | null
          file_url: string | null
          file_type: string | null
          extracted_data: any | null
          parsing_success: boolean
          parsing_errors: string | null
          ai_confidence_score: number | null
          processing_time_seconds: number | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          original_filename?: string | null
          file_url?: string | null
          file_type?: string | null
          extracted_data?: any | null
          parsing_success?: boolean
          parsing_errors?: string | null
          ai_confidence_score?: number | null
          processing_time_seconds?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          original_filename?: string | null
          file_url?: string | null
          file_type?: string | null
          extracted_data?: any | null
          parsing_success?: boolean
          parsing_errors?: string | null
          ai_confidence_score?: number | null
          processing_time_seconds?: number | null
          created_at?: string
        }
      }
      applications: {
        Row: {
          id: string
          job_id: string
          applicant_id: string
          status:
            | 'pending'
            | 'reviewing'
            | 'interview'
            | 'interviewed'
            | 'offered'
            | 'hired'
            | 'accepted'
            | 'rejected'
          cover_letter: string | null
          resume_url: string | null
          notes: string | null
          match_score_id: string | null
          applied_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          job_id: string
          applicant_id: string
          status?:
            | 'pending'
            | 'reviewing'
            | 'interview'
            | 'interviewed'
            | 'offered'
            | 'hired'
            | 'accepted'
            | 'rejected'
          cover_letter?: string | null
          resume_url?: string | null
          notes?: string | null
          match_score_id?: string | null
          applied_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          job_id?: string
          applicant_id?: string
          status?:
            | 'pending'
            | 'reviewing'
            | 'interview'
            | 'interviewed'
            | 'offered'
            | 'hired'
            | 'accepted'
            | 'rejected'
          cover_letter?: string | null
          resume_url?: string | null
          notes?: string | null
          match_score_id?: string | null
          applied_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: 'employer' | 'job_seeker'
      job_status: 'draft' | 'published' | 'closed' | 'cancelled'
      application_status:
        | 'pending'
        | 'reviewing'
        | 'interview'
        | 'interviewed'
        | 'offered'
        | 'hired'
        | 'accepted'
        | 'rejected'
      job_type: 'full_time' | 'part_time' | 'contract' | 'internship'
      experience_level: 'entry' | 'junior' | 'mid' | 'senior' | 'executive'
    }
  }
}
