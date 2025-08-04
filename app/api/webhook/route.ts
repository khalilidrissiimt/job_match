import { NextRequest, NextResponse } from 'next/server'
import { extractSkills, summarizeSkills } from '@/lib/ai'
import { generatePDFReport } from '@/lib/pdf'
import { extractTextFromPDF } from '@/lib/pdf-extractor'

export async function POST(request: NextRequest) {
  try {
    // Check if it's a multipart form data (PDF file) or JSON
    const contentType = request.headers.get('content-type') || ''
    
    let jobDescription = ''
    let extraNotes = ''
    let uploadedPdfBuffer: Buffer | null = null

    if (contentType.includes('multipart/form-data')) {
      // Handle PDF file upload from n8n
      const formData = await request.formData()
      const file = formData.get('file') as File
      
      if (!file) {
        return NextResponse.json(
          { error: 'No PDF file provided' },
          { status: 400 }
        )
      }

      // Convert File to Buffer
      const arrayBuffer = await file.arrayBuffer()
      uploadedPdfBuffer = Buffer.from(arrayBuffer)
      
      // Extract text from PDF
      const extractedText = await extractTextFromPDF(uploadedPdfBuffer)
      if (!extractedText) {
        return NextResponse.json(
          { error: 'Failed to extract text from PDF' },
          { status: 400 }
        )
      }
      
      jobDescription = extractedText
      extraNotes = formData.get('extra_notes') as string || ''
      
    } else {
      // Handle JSON payload
      const body = await request.json()
      jobDescription = body.job_description || ''
      extraNotes = body.extra_notes || ''
      
      if (!jobDescription) {
        return NextResponse.json(
          { error: 'job_description is required' },
          { status: 400 }
        )
      }
    }

    // Extract skills from job description
    const jobSkills = await extractSkills(`${jobDescription}\n\n${extraNotes}`)
    
    if (!jobSkills.length) {
      return NextResponse.json(
        { error: 'No skills could be extracted from the job description' },
        { status: 400 }
      )
    }

    // For now, use mock candidates (you can replace this with actual Supabase data)
    const mockCandidates = [
      {
        candidate_name: "John Doe",
        match_count: 3,
        matched_skills: ["react", "typescript", "javascript"],
        summary: "Experienced frontend developer with strong React and TypeScript skills.",
        feedback_review: "",
        transcript: "Interview went well. Candidate showed good understanding of React concepts and TypeScript. Demonstrated strong problem-solving skills and communicated clearly.",
        feedback: {
          "raw": "The candidate demonstrates excellent technical skills with strong problem-solving abilities. They communicate clearly and show high confidence throughout the interview. Their motivation is genuine and they align well with our company values. The candidate provides specific examples of their achievements and shows strong leadership potential. Overall, this is an outstanding candidate who would be a valuable addition to our team.",
          "confidence": "The candidate presents themselves with a high level of confidence. Their tone is assertive and they share specific accomplishments with quantifiable impact. They demonstrate strong self-assurance throughout the interview.",
          "motivation": "The candidate conveys genuine enthusiasm for the role and company mission. They articulate a clear vision for their career goals and how this role aligns perfectly with their aspirations.",
          "communication": "The candidate communicates exceptionally clearly and concisely. They structure their responses well, avoid filler words, and articulate complex technical concepts in an accessible manner.",
          "final_assessment": "The candidate presents as an outstanding individual with excellent technical skills and a positive, professional attitude. Their communication is clear, confidence is high, and they provide concrete examples to support their claims. They are highly suitable for the role.",
          "leadership_influence": "The candidate demonstrates strong leadership potential through examples of initiative, mentoring junior colleagues, and influencing team decisions. They provide specific instances of leadership impact.",
          "collaboration_teamwork": "The candidate excels in teamwork and collaboration. They provide concrete examples of successful collaborative projects and highlight their role in fostering positive team dynamics.",
          "emotional_intelligence": "The candidate demonstrates excellent emotional intelligence through empathetic responses and strong awareness of social cues. They provide examples of navigating difficult conversations and resolving conflicts.",
          "decision_making_quality": "The candidate demonstrates excellent decision-making by considering multiple factors and weighing outcomes. They provide clear examples of difficult decisions and their rationale.",
          "accountability_ownership": "The candidate demonstrates strong accountability by taking full responsibility for their actions and results. They provide specific examples of taking ownership of challenging situations.",
          "technical_depth_accuracy": "The candidate exhibits excellent technical depth and accuracy. They demonstrate nuanced understanding of technical concepts and discuss industry best practices effectively.",
          "adaptability_learning_mindset": "The candidate shows exceptional adaptability and learning mindset. They provide specific examples of successfully adapting to new technologies and challenges.",
          "cultural_fit_values_alignment": "The candidate demonstrates excellent cultural fit and values alignment. They explicitly align their values with company values and provide concrete examples.",
          "time_management_prioritization": "The candidate demonstrates excellent time management skills. They provide specific examples of managing multiple projects with competing deadlines.",
          "analytical_thinking_problem_solving": "The candidate demonstrates exceptional analytical thinking by breaking down complex problems effectively. They explore alternative solutions and acknowledge potential limitations."
        }
      },
      {
        candidate_name: "Jane Smith",
        match_count: 2,
        matched_skills: ["javascript", "react"],
        summary: "Skilled JavaScript developer with React experience.",
        feedback_review: "",
        transcript: "Candidate has solid technical skills but needs to work on communication during team discussions. Technical knowledge is good but presentation skills need improvement.",
        feedback: {
          "raw": "The candidate shows solid technical skills but has some communication challenges. They demonstrate good problem-solving abilities but occasionally struggle to articulate complex concepts clearly. Their motivation is genuine and they show potential for growth. While there are areas for improvement, particularly in communication clarity, the candidate has a solid foundation and could be successful with proper support and development.",
          "confidence": "The candidate presents themselves with a moderate level of confidence. Their tone is generally assertive, but there are moments of hesitation. Sharing specific accomplishments and quantifying their impact could boost their confidence.",
          "motivation": "The candidate conveys a genuine interest in the role and the company's mission. They express enthusiasm for the opportunity to contribute their skills and learn from experienced professionals.",
          "communication": "The candidate generally communicates clearly, though there are instances where their explanations could be more concise. They articulate their thoughts well, but occasionally use filler words, which slightly impacts the flow of their responses.",
          "final_assessment": "The candidate presents as a promising individual with a solid foundation of technical skills and a positive attitude. While there are areas for improvement, such as enhancing communication clarity and demonstrating greater confidence, their overall performance suggests they have potential.",
          "leadership_influence": "While the candidate doesn't explicitly discuss leadership roles, they demonstrate potential for leadership through their initiative and problem-solving skills. Providing examples of situations where they have taken initiative would showcase their leadership potential.",
          "collaboration_teamwork": "The candidate acknowledges the importance of teamwork and collaboration. They mention their ability to work effectively with others and contribute to a shared goal. Providing concrete examples of successful collaborative projects would further demonstrate their teamwork skills.",
          "emotional_intelligence": "The candidate demonstrates a degree of emotional intelligence through their empathetic responses and awareness of social cues. Providing examples of how they have navigated difficult conversations would further showcase their emotional intelligence.",
          "decision_making_quality": "The candidate demonstrates a structured approach to decision-making by considering various factors and weighing potential outcomes. They articulate their reasoning clearly and justify their choices.",
          "accountability_ownership": "The candidate demonstrates a sense of accountability by taking responsibility for their actions and results. They acknowledge both successes and failures and express a willingness to learn from their mistakes.",
          "technical_depth_accuracy": "The candidate exhibits a good understanding of the technical concepts relevant to the role. They accurately use technical terminology and provide clear explanations of their problem-solving approaches.",
          "adaptability_learning_mindset": "The candidate expresses a willingness to learn and adapt to new technologies and challenges. They demonstrate curiosity and a proactive approach to acquiring new skills.",
          "cultural_fit_values_alignment": "The candidate's demeanor and communication style suggest a good cultural fit with the company. They demonstrate professionalism and respect throughout the interview.",
          "time_management_prioritization": "The candidate touches upon their ability to manage their time effectively and prioritize tasks. Providing specific examples of how they have successfully managed multiple projects would further demonstrate their time management skills.",
          "analytical_thinking_problem_solving": "The candidate demonstrates solid analytical thinking by breaking down complex problems into smaller, manageable components. They provide logical explanations for their solutions and offer relevant examples to support their reasoning."
        }
      }
    ]

    // Generate PDF report
    const generatedPdfBuffer = await generatePDFReport(mockCandidates)
    const pdfBase64 = Buffer.from(generatedPdfBuffer).toString('base64')

    // Prepare response data
    const responseData = {
      success: true,
      candidates: mockCandidates,
      pdf_base64: pdfBase64,
      extracted_skills: jobSkills,
      processed_at: new Date().toISOString()
    }

    // Send response back to n8n webhook
    try {
      const n8nResponse = await fetch('https://kkii.app.n8n.cloud/webhook-test/return', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(responseData),
      })

      if (!n8nResponse.ok) {
        console.error('Failed to send response to n8n:', n8nResponse.status)
      }
    } catch (n8nError) {
      console.error('Error sending to n8n:', n8nError)
      // Don't fail the request if n8n is unreachable
    }

    // Return the response data
    return NextResponse.json(responseData)

  } catch (error) {
    console.error('Webhook API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 