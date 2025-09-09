import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/database.types'

// Sample data for seeding the database
const SAMPLE_COMPANIES = [
  {
    name: 'TechKZ',
    description: 'Ведущая IT-компания в Казахстане, специализирующаяся на разработке веб-приложений и мобильных приложений.',
    website: 'https://techkz.com',
    industry: 'Information Technology',
    size: 'Medium (50-200)',
    location: 'Алматы'
  },
  {
    name: 'Almaty Digital',
    description: 'Цифровое агентство полного цикла, занимающееся созданием брендов и цифровых решений.',
    website: 'https://almatydigital.kz',
    industry: 'Marketing & Advertising',
    size: 'Small (10-50)',
    location: 'Алматы'
  },
  {
    name: 'Astana Innovations',
    description: 'Инновационная компания, работающая в области финтеха и блокчейн технологий.',
    website: 'https://astanainnovations.kz',
    industry: 'Financial Technology',
    size: 'Medium (50-200)',
    location: 'Астана'
  },
  {
    name: 'Kazakhstan Software',
    description: 'Разработка корпоративного программного обеспечения для крупного бизнеса.',
    website: 'https://kzsoftware.kz',
    industry: 'Software Development',
    size: 'Large (200+)',
    location: 'Шымкент'
  }
]

const SAMPLE_SKILLS = [
  { name: 'JavaScript', category: 'technical' },
  { name: 'React', category: 'technical' },
  { name: 'Node.js', category: 'technical' },
  { name: 'Python', category: 'technical' },
  { name: 'SQL', category: 'technical' },
  { name: 'HTML/CSS', category: 'technical' },
  { name: 'TypeScript', category: 'technical' },
  { name: 'Git', category: 'technical' },
  { name: 'Docker', category: 'technical' },
  { name: 'AWS', category: 'technical' },
  { name: 'Communication', category: 'soft' },
  { name: 'Teamwork', category: 'soft' },
  { name: 'Leadership', category: 'soft' },
  { name: 'Problem Solving', category: 'soft' },
  { name: 'Time Management', category: 'soft' },
  { name: 'English', category: 'language' },
  { name: 'Russian', category: 'language' },
  { name: 'Kazakh', category: 'language' }
]

const SAMPLE_JOBS = [
  {
    title: 'Frontend Developer',
    description: 'Мы ищем талантливого Frontend разработчика для присоединения к нашей команде. Вы будете работать над созданием современных веб-приложений используя React и TypeScript.',
    requirements: 'Опыт работы с React от 2 лет, знание TypeScript, понимание REST API, опыт работы с Git.',
    responsibilities: 'Разработка пользовательских интерфейсов, интеграция с API, тестирование кода, участие в code review.',
    job_type: 'full_time' as const,
    experience_level: 'mid' as const,
    salary_min: 400000,
    salary_max: 600000,
    currency: 'KZT',
    location: 'Алматы',
    remote_allowed: true,
    status: 'published' as const,
    required_skills: ['JavaScript', 'React', 'TypeScript', 'HTML/CSS'],
    preferred_skills: ['Git', 'Communication', 'English']
  },
  {
    title: 'Python Backend Developer',
    description: 'Присоединяйтесь к нашей команде в качестве Python разработчика. Вы будете работать над серверной частью приложений и API.',
    requirements: 'Опыт работы с Python от 3 лет, знание Django/FastAPI, опыт работы с базами данных, понимание принципов REST.',
    responsibilities: 'Разработка серверной логики, создание API, оптимизация баз данных, деплой приложений.',
    job_type: 'full_time' as const,
    experience_level: 'senior' as const,
    salary_min: 600000,
    salary_max: 800000,
    currency: 'KZT',
    location: 'Астана',
    remote_allowed: false,
    status: 'published' as const,
    required_skills: ['Python', 'SQL', 'Git'],
    preferred_skills: ['AWS', 'Docker', 'English', 'Leadership']
  },
  {
    title: 'UI/UX Designer',
    description: 'Ищем креативного UI/UX дизайнера для работы над пользовательским опытом наших продуктов.',
    requirements: 'Опыт в UI/UX дизайне от 2 лет, владение Figma/Adobe XD, понимание принципов user-centered design.',
    responsibilities: 'Создание дизайна интерфейсов, проведение пользовательских исследований, создание прототипов, работа с командой разработки.',
    job_type: 'part_time' as const,
    experience_level: 'mid' as const,
    salary_min: 300000,
    salary_max: 450000,
    currency: 'KZT',
    location: 'Алматы',
    remote_allowed: true,
    status: 'published' as const,
    required_skills: ['Communication', 'Problem Solving'],
    preferred_skills: ['English', 'Teamwork']
  },
  {
    title: 'DevOps Engineer',
    description: 'Нужен опытный DevOps инженер для автоматизации процессов развертывания и поддержки инфраструктуры.',
    requirements: 'Опыт работы с Docker, Kubernetes, AWS/Azure, знание CI/CD, опыт с мониторингом систем.',
    responsibilities: 'Настройка и поддержка инфраструктуры, автоматизация деплоя, мониторинг систем, обеспечение безопасности.',
    job_type: 'full_time' as const,
    experience_level: 'senior' as const,
    salary_min: 700000,
    salary_max: 1000000,
    currency: 'KZT',
    location: 'Шымкент',
    remote_allowed: true,
    status: 'published' as const,
    required_skills: ['Docker', 'AWS', 'Git'],
    preferred_skills: ['Python', 'SQL', 'English', 'Problem Solving']
  },
  {
    title: 'Junior JavaScript Developer',
    description: 'Отличная возможность для начала карьеры в веб-разработке. Мы предоставляем менторство и обучение.',
    requirements: 'Базовые знания JavaScript, HTML, CSS, желание учиться и расти, понимание основ программирования.',
    responsibilities: 'Изучение технологий, помощь в разработке простых функций, участие в code review, обучение у senior разработчиков.',
    job_type: 'full_time' as const,
    experience_level: 'entry' as const,
    salary_min: 200000,
    salary_max: 300000,
    currency: 'KZT',
    location: 'Алматы',
    remote_allowed: false,
    status: 'published' as const,
    required_skills: ['JavaScript', 'HTML/CSS'],
    preferred_skills: ['Git', 'English', 'Communication', 'Time Management']
  }
]

const DEFAULT_QUESTIONS = [
  {
    question_text: 'Опишите самую большую неудачу в вашей карьере и что она вас научила.',
    question_type: 'open_ended',
    category: 'problem_solving',
    is_active: true,
    order_index: 1
  },
  {
    question_text: 'Расскажите о ситуации, когда вам пришлось работать в команде с конфликтными людьми. Как вы решили эту проблему?',
    question_type: 'open_ended',
    category: 'teamwork',
    is_active: true,
    order_index: 2
  },
  {
    question_text: 'Опишите проект или инициативу, которую вы начали сами, без указания руководства.',
    question_type: 'open_ended',
    category: 'initiative',
    is_active: true,
    order_index: 3
  },
  {
    question_text: 'Как вы обычно принимаете важные решения? Опишите свой процесс на конкретном примере.',
    question_type: 'open_ended',
    category: 'decision_making',
    is_active: true,
    order_index: 4
  },
  {
    question_text: 'Расскажите о времени, когда вам пришлось изучить что-то совершенно новое для работы. Как вы подошли к обучению?',
    question_type: 'open_ended',
    category: 'learning',
    is_active: true,
    order_index: 5
  },
  {
    question_text: 'Опишите ситуацию, когда вы не согласились с решением руководства. Как вы отреагировали?',
    question_type: 'open_ended',
    category: 'leadership',
    is_active: true,
    order_index: 6
  },
  {
    question_text: 'Что вас мотивирует больше всего в работе? Приведите конкретные примеры.',
    question_type: 'open_ended',
    category: 'motivation',
    is_active: true,
    order_index: 7
  }
]

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies })
    
    // Verify authentication
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      )
    }
    
    const { tables } = await request.json()
    const results: any = {}

    // Seed skills
    if (!tables || tables.includes('skills')) {
      const { data: existingSkills } = await supabase
        .from('skills')
        .select('name')

      const existingSkillNames = existingSkills?.map(s => s.name) || []
      const newSkills = SAMPLE_SKILLS.filter(skill => !existingSkillNames.includes(skill.name))

      if (newSkills.length > 0) {
        const { data, error } = await supabase
          .from('skills')
          .insert(newSkills)
          .select()

        results.skills = { inserted: data?.length || 0, error }
      } else {
        results.skills = { inserted: 0, message: 'All skills already exist' }
      }
    }

    // Seed questionnaires
    if (!tables || tables.includes('questionnaires')) {
      const { data: existingQuestions } = await supabase
        .from('questionnaires')
        .select('id')

      if (!existingQuestions || existingQuestions.length === 0) {
        const { data, error } = await supabase
          .from('questionnaires')
          .insert(DEFAULT_QUESTIONS)
          .select()

        results.questionnaires = { inserted: data?.length || 0, error }
      } else {
        results.questionnaires = { inserted: 0, message: 'Questions already exist' }
      }
    }

    // Seed companies (requires employer users to be created first)
    if (!tables || tables.includes('companies')) {
      const { data: existingCompanies } = await supabase
        .from('companies')
        .select('name')

      const existingCompanyNames = existingCompanies?.map(c => c.name) || []
      const newCompanies = SAMPLE_COMPANIES.filter(company => !existingCompanyNames.includes(company.name))

      if (newCompanies.length > 0) {
        // We need to create dummy employer users first
        const dummyEmployers = newCompanies.map((company, index) => ({
          id: `employer_${index + 1}`,
          email: `employer${index + 1}@${company.name.toLowerCase().replace(/\s+/g, '')}.kz`,
          full_name: `${company.name} HR Manager`,
          role: 'employer' as const
        }))

        // Insert dummy users (this might fail if they exist, which is fine)
        const { error: userError } = await supabase
          .from('users')
          .insert(dummyEmployers)

        // Insert companies with owner references
        const companiesWithOwners = newCompanies.map((company, index) => ({
          ...company,
          owner_id: `employer_${index + 1}`
        }))

        const { data, error } = await supabase
          .from('companies')
          .insert(companiesWithOwners)
          .select()

        results.companies = { inserted: data?.length || 0, error, userError }
      } else {
        results.companies = { inserted: 0, message: 'All companies already exist' }
      }
    }

    // Seed jobs (requires companies to exist)
    if (!tables || tables.includes('jobs')) {
      const { data: companies } = await supabase
        .from('companies')
        .select('id, name, owner_id')

      if (companies && companies.length > 0) {
        const { data: existingJobs } = await supabase
          .from('jobs')
          .select('title')

        const existingJobTitles = existingJobs?.map(j => j.title) || []
        const newJobs = SAMPLE_JOBS.filter(job => !existingJobTitles.includes(job.title))

        if (newJobs.length > 0) {
          // Assign jobs to companies randomly
          const jobsWithCompanies = newJobs.map((job, index) => {
            const company = companies[index % companies.length]
            const { required_skills, preferred_skills, ...jobData } = job
            return {
              ...jobData,
              company_id: company.id,
              employer_id: company.owner_id,
              posted_at: new Date().toISOString()
            }
          })

          const { data: insertedJobs, error: jobError } = await supabase
            .from('jobs')
            .insert(jobsWithCompanies)
            .select()

          // Get skills data
          const { data: skillsData } = await supabase
            .from('skills')
            .select('id, name')

          const skillMap = skillsData?.reduce((acc, skill) => {
            acc[skill.name] = skill.id
            return acc
          }, {} as Record<string, string>) || {}

          // Insert job skills
          let jobSkillsInserted = 0
          if (insertedJobs && skillsData) {
            for (let i = 0; i < insertedJobs.length; i++) {
              const job = insertedJobs[i]
              const originalJob = newJobs[i]
              
              // Create job skills entries
              const jobSkills = []
              
              // Required skills
              for (const skillName of originalJob.required_skills) {
                if (skillMap[skillName]) {
                  jobSkills.push({
                    job_id: job.id,
                    skill_id: skillMap[skillName],
                    required: true
                  })
                }
              }
              
              // Preferred skills
              for (const skillName of originalJob.preferred_skills) {
                if (skillMap[skillName]) {
                  jobSkills.push({
                    job_id: job.id,
                    skill_id: skillMap[skillName],
                    required: false
                  })
                }
              }

              if (jobSkills.length > 0) {
                const { data: insertedSkills } = await supabase
                  .from('job_skills')
                  .insert(jobSkills)
                  .select()
                
                jobSkillsInserted += insertedSkills?.length || 0
              }
            }
          }

          results.jobs = { 
            inserted: insertedJobs?.length || 0, 
            jobSkillsInserted,
            error: jobError 
          }
        } else {
          results.jobs = { inserted: 0, message: 'All jobs already exist' }
        }
      } else {
        results.jobs = { inserted: 0, error: 'No companies found - seed companies first' }
      }
    }

    // Seed saved jobs for the current user (requires jobs to exist)
    if (!tables || tables.includes('saved_jobs')) {
      const userId = session.user.id

      // Ensure current user exists in users table
      const { data: currentUser } = await supabase
        .from('users')
        .select('id, role')
        .eq('id', userId)
        .single()

      if (currentUser) {
        const { data: existingSaved } = await supabase
          .from('saved_jobs')
          .select('job_id')
          .eq('candidate_id', userId)

        const alreadySaved = new Set((existingSaved || []).map((s: any) => s.job_id))

        const { data: jobs } = await supabase
          .from('jobs')
          .select('id, status')
          .eq('status', 'published')
          .limit(3)

        const toSave = (jobs || [])
          .filter(j => !alreadySaved.has(j.id))
          .map(j => ({ job_id: j.id, candidate_id: userId }))

        if (toSave.length > 0) {
          const { data: saved, error: savedError } = await supabase
            .from('saved_jobs')
            .insert(toSave)
            .select()

          results.saved_jobs = { inserted: saved?.length || 0, error: savedError }
        } else {
          results.saved_jobs = { inserted: 0, message: 'No new saved jobs to insert' }
        }
      } else {
        results.saved_jobs = { inserted: 0, error: 'Current user not found in users table' }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully',
      results
    })

  } catch (error) {
    console.error('Seeding error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to seed database' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Database seeding endpoint',
    usage: 'POST to this endpoint to seed the database with sample data',
    options: {
      tables: 'Optional array of table names to seed: skills, questionnaires, companies, jobs'
    }
  })
}