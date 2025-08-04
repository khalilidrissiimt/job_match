import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

export interface Candidate {
  id: string
  candidate_name: string
  skills: string
  feedback: any
  transcript: string
}

export interface MatchedCandidate {
  candidate_name: string
  match_count: number
  matched_skills: string[]
  feedback: any
  all_skills: string[]
  transcript: string
}

export async function fetchCandidatesPaginated(limit = 1000): Promise<Candidate[]> {
  const allCandidates: Candidate[] = []
  let offset = 0

  while (true) {
    const { data, error } = await supabase
      .from('interviews')
      .select('id, candidate_name, skills, feedback, transcript')
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching candidates:', error)
      break
    }

    if (!data || data.length === 0) {
      break
    }

    allCandidates.push(...data)
    
    if (data.length < limit) {
      break
    }
    
    offset += limit
  }

  return allCandidates
}

export function matchCandidates(jobSkills: string[], candidates: Candidate[]): MatchedCandidate[] {
  const jobSet = new Set(jobSkills)
  const matches: MatchedCandidate[] = []

  for (const candidate of candidates) {
    const skills = candidate.skills
      ?.split(',')
      .map(s => s.trim().toLowerCase())
      .filter(s => s.length > 0) || []

    const matched = Array.from(jobSet).filter(skill => 
      skills.some(candidateSkill => 
        candidateSkill.includes(skill) || skill.includes(candidateSkill)
      )
    )

    if (matched.length > 0) {
      matches.push({
        candidate_name: candidate.candidate_name || 'Unnamed',
        match_count: matched.length,
        matched_skills: matched.sort(),
        feedback: candidate.feedback,
        all_skills: skills,
        transcript: candidate.transcript || ''
      })
    }
  }

  return matches.sort((a, b) => b.match_count - a.match_count)
} 