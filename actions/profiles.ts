"use server"

import { z } from "zod"
import { supabase } from "@/lib/supabase-client"
import { getCurrentUser } from "./auth"

// Types
interface Profile {
  id: string
  email: string
  full_name: string
  role: "employer" | "employee"
  company_name?: string
  bio?: string
  skills?: string[]
  experience?: string
  education?: string
  location?: string
  phone?: string
  website?: string
  linkedin?: string
  github?: string
  avatar_url?: string
  created_at?: string
  updated_at?: string
}

interface CompanyProfile {
  id: string
  employer_id: string
  company_name: string
  company_description?: string
  company_website?: string
  company_size?: string
  industry?: string
  founded_year?: number
  headquarters?: string
  logo_url?: string
  benefits?: string[]
  culture_values?: string[]
  created_at?: string
  updated_at?: string
}

// Schemas
const updateProfileSchema = z.object({
  full_name: z.string().min(2, "Full name must be at least 2 characters"),
  bio: z.string().optional(),
  skills: z.array(z.string()).optional(),
  experience: z.string().optional(),
  education: z.string().optional(),
  location: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().url("Invalid website URL").optional().or(z.literal("")),
  linkedin: z.string().url("Invalid LinkedIn URL").optional().or(z.literal("")),
  github: z.string().url("Invalid GitHub URL").optional().or(z.literal("")),
})

const updateCompanyProfileSchema = z.object({
  company_name: z.string().min(2, "Company name must be at least 2 characters"),
  company_description: z.string().optional(),
  company_website: z.string().url("Invalid website URL").optional().or(z.literal("")),
  company_size: z.enum(["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"]).optional(),
  industry: z.string().optional(),
  founded_year: z.number().min(1800).max(new Date().getFullYear()).optional(),
  headquarters: z.string().optional(),
  benefits: z.array(z.string()).optional(),
  culture_values: z.array(z.string()).optional(),
})

// Profile functions
export async function getProfile(userId?: string): Promise<Profile | null> {
  try {
    const user = await getCurrentUser()
    const targetUserId = userId || user?.id

    if (!targetUserId) {
      return null
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', targetUserId)
      .single()

    if (error || !data) {
      return null
    }

    return data as Profile
  } catch (error) {
    return null
  }
}

export async function updateProfile(formData: FormData) {
  const user = await getCurrentUser()
  if (!user) {
    return {
      success: false,
      message: "Unauthorized. Please login to update your profile.",
    }
  }

  const data = Object.fromEntries(formData)
  const skillsArray = data.skills ? String(data.skills).split(',').filter(Boolean) : []

  const parsed = updateProfileSchema.safeParse({
    ...data,
    skills: skillsArray.length ? skillsArray : undefined,
  })

  if (!parsed.success) {
    return {
      success: false,
      message: "Invalid form data. Please check your entries.",
      errors: parsed.error.flatten().fieldErrors,
    }
  }

  try {
    const { data: profileData, error } = await supabase
      .from('users')
      .update({
        ...parsed.data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select()
      .single()

    if (error) {
      return {
        success: false,
        message: "Failed to update profile. Please try again.",
      }
    }

    return {
      success: true,
      message: "Profile updated successfully!",
      data: profileData,
    }
  } catch (error) {
    return {
      success: false,
      message: "An unexpected error occurred. Please try again.",
    }
  }
}

export async function getCompanyProfile(employerId?: string): Promise<CompanyProfile | null> {
  try {
    const user = await getCurrentUser()
    const targetEmployerId = employerId || user?.id

    if (!targetEmployerId) {
      return null
    }

    const { data, error } = await supabase
      .from('company_profiles')
      .select('*')
      .eq('employer_id', targetEmployerId)
      .single()

    if (error || !data) {
      return null
    }

    return data as CompanyProfile
  } catch (error) {
    return null
  }
}

export async function updateCompanyProfile(formData: FormData) {
  const user = await getCurrentUser()
  if (!user || user.role !== "employer") {
    return {
      success: false,
      message: "Unauthorized. Only employers can update company profiles.",
    }
  }

  const data = Object.fromEntries(formData)
  const benefitsArray = data.benefits ? String(data.benefits).split(',').filter(Boolean) : []
  const cultureValuesArray = data.culture_values ? String(data.culture_values).split(',').filter(Boolean) : []

  const parsed = updateCompanyProfileSchema.safeParse({
    ...data,
    benefits: benefitsArray.length ? benefitsArray : undefined,
    culture_values: cultureValuesArray.length ? cultureValuesArray : undefined,
    founded_year: data.founded_year ? Number(data.founded_year) : undefined,
  })

  if (!parsed.success) {
    return {
      success: false,
      message: "Invalid form data. Please check your entries.",
      errors: parsed.error.flatten().fieldErrors,
    }
  }

  try {
    // Check if company profile exists
    const { data: existingProfile } = await supabase
      .from('company_profiles')
      .select('id')
      .eq('employer_id', user.id)
      .single()

    let profileData

    if (existingProfile) {
      // Update existing profile
      const { data, error } = await supabase
        .from('company_profiles')
        .update({
          ...parsed.data,
          updated_at: new Date().toISOString(),
        })
        .eq('employer_id', user.id)
        .select()
        .single()

      if (error) {
        return {
          success: false,
          message: "Failed to update company profile. Please try again.",
        }
      }

      profileData = data
    } else {
      // Create new profile
      const { data, error } = await supabase
        .from('company_profiles')
        .insert({
          ...parsed.data,
          employer_id: user.id,
        })
        .select()
        .single()

      if (error) {
        return {
          success: false,
          message: "Failed to create company profile. Please try again.",
        }
      }

      profileData = data
    }

    // Also update company_name in users table
    await supabase
      .from('users')
      .update({ company_name: parsed.data.company_name })
      .eq('id', user.id)

    return {
      success: true,
      message: "Company profile updated successfully!",
      data: profileData,
    }
  } catch (error) {
    return {
      success: false,
      message: "An unexpected error occurred. Please try again.",
    }
  }
}

export async function uploadAvatar(formData: FormData) {
  const user = await getCurrentUser()
  if (!user) {
    return {
      success: false,
      message: "Unauthorized. Please login to upload an avatar.",
    }
  }

  const file = formData.get('avatar') as File
  if (!file || file.size === 0) {
    return {
      success: false,
      message: "Please select a valid image file.",
    }
  }

  // Check file type
  if (!file.type.startsWith('image/')) {
    return {
      success: false,
      message: "Please select an image file.",
    }
  }

  // Check file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    return {
      success: false,
      message: "File size must be less than 5MB.",
    }
  }

  try {
    // Upload file to Supabase storage
    const fileName = `${user.id}-${Date.now()}.${file.name.split('.').pop()}`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      return {
        success: false,
        message: "Failed to upload image. Please try again.",
      }
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(uploadData.path)

    // Update user profile with avatar URL
    const { error: updateError } = await supabase
      .from('users')
      .update({ avatar_url: urlData.publicUrl })
      .eq('id', user.id)

    if (updateError) {
      // Cleanup uploaded file if profile update fails
      await supabase.storage
        .from('avatars')
        .remove([uploadData.path])

      return {
        success: false,
        message: "Failed to update profile. Please try again.",
      }
    }

    return {
      success: true,
      message: "Avatar uploaded successfully!",
      data: { avatar_url: urlData.publicUrl },
    }
  } catch (error) {
    return {
      success: false,
      message: "An unexpected error occurred. Please try again.",
    }
  }
}

export async function uploadCompanyLogo(formData: FormData) {
  const user = await getCurrentUser()
  if (!user || user.role !== "employer") {
    return {
      success: false,
      message: "Unauthorized. Only employers can upload company logos.",
    }
  }

  const file = formData.get('logo') as File
  if (!file || file.size === 0) {
    return {
      success: false,
      message: "Please select a valid image file.",
    }
  }

  // Check file type
  if (!file.type.startsWith('image/')) {
    return {
      success: false,
      message: "Please select an image file.",
    }
  }

  // Check file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    return {
      success: false,
      message: "File size must be less than 5MB.",
    }
  }

  try {
    // Upload file to Supabase storage
    const fileName = `company-${user.id}-${Date.now()}.${file.name.split('.').pop()}`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('company-logos')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      return {
        success: false,
        message: "Failed to upload logo. Please try again.",
      }
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('company-logos')
      .getPublicUrl(uploadData.path)

    // Update or create company profile with logo URL
    const { data: existingProfile } = await supabase
      .from('company_profiles')
      .select('id')
      .eq('employer_id', user.id)
      .single()

    if (existingProfile) {
      // Update existing profile
      await supabase
        .from('company_profiles')
        .update({ logo_url: urlData.publicUrl })
        .eq('employer_id', user.id)
    } else {
      // Create new profile with logo
      await supabase
        .from('company_profiles')
        .insert({
          employer_id: user.id,
          company_name: user.company_name || 'Company Name',
          logo_url: urlData.publicUrl,
        })
    }

    return {
      success: true,
      message: "Company logo uploaded successfully!",
      data: { logo_url: urlData.publicUrl },
    }
  } catch (error) {
    return {
      success: false,
      message: "An unexpected error occurred. Please try again.",
    }
  }
}

export async function searchProfiles(query?: string, filters?: {
  role?: "employer" | "employee"
  location?: string
  skills?: string[]
}): Promise<Profile[]> {
  try {
    let queryBuilder = supabase
      .from('users')
      .select('id, email, full_name, role, company_name, bio, skills, location, avatar_url')

    if (query) {
      queryBuilder = queryBuilder.or(
        `full_name.ilike.%${query}%,bio.ilike.%${query}%,company_name.ilike.%${query}%`
      )
    }

    if (filters?.role) {
      queryBuilder = queryBuilder.eq('role', filters.role)
    }

    if (filters?.location) {
      queryBuilder = queryBuilder.ilike('location', `%${filters.location}%`)
    }

    if (filters?.skills && filters.skills.length > 0) {
      queryBuilder = queryBuilder.overlaps('skills', filters.skills)
    }

    const { data, error } = await queryBuilder.order('created_at', { ascending: false })

    if (error || !data) {
      return []
    }

    return data as Profile[]
  } catch (error) {
    return []
  }
}