import { PDFDocument, StandardFonts, rgb, PageSizes } from 'pdf-lib'

export interface PDFCandidate {
  candidate_name: string
  match_count: number
  matched_skills: string[]
  summary: string
  feedback_review: string
  transcript: string
  feedback?: any // Add feedback field for JSONB data
}

// Function to sanitize text for PDF generation
function sanitizeTextForPDF(text: string): string {
  return text
    .replace(/⚠️/g, '[WARNING]')
    .replace(/✅/g, '[SUITABLE]')
    .replace(/❌/g, '[NOT SUITABLE]')
    .replace(/\n/g, ' ') // Replace newlines with spaces
    .replace(/\r/g, ' ') // Replace carriage returns with spaces
    .replace(/\t/g, ' ') // Replace tabs with spaces
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/[^\x00-\x7F]/g, '') // Remove all non-ASCII characters
    .trim();
}

// Function to format JSONB feedback as key-value pairs
function formatFeedbackForPDF(feedback: any): string {
  if (!feedback || typeof feedback !== 'object') {
    return 'No feedback data available';
  }

  const formattedLines: string[] = [];
  
  Object.entries(feedback).forEach(([key, value]) => {
    if (key === 'raw') return; // Skip raw field as it's redundant
    const formattedKey = key.replace(/_/g, ' ').toUpperCase();
    const formattedValue = typeof value === 'string' ? value : String(value);
    formattedLines.push(`${formattedKey}: ${formattedValue}`);
  });

  return formattedLines.join('\n');
}

// Function to format transcript with proper line breaks
function formatTranscriptForPDF(transcript: string): string {
  if (!transcript) return 'Not available';
  
  // Split by common transcript patterns
  const lines = transcript.split(/(?=Assistant:|User:|Interviewer:|Candidate:)/);
  
  if (lines.length > 1) {
    return lines.map(line => line.trim()).filter(line => line.length > 0).join('\n');
  }
  
  // If no clear speaker indicators, just return the original
  return transcript;
}

export async function generatePDFReport(candidates: PDFCandidate[]): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  for (let i = 0; i < candidates.length; i++) {
    const candidate = candidates[i]
    const page = pdfDoc.addPage(PageSizes.A4)
    const { width, height } = page.getSize()
    
    const margin = 50
    const contentWidth = width - 2 * margin
    let yPosition = height - margin

    // Title
    page.drawText(`Candidate ${i + 1}: ${candidate.candidate_name}`, {
      x: margin,
      y: yPosition,
      size: 16,
      font: helveticaBold,
      color: rgb(0, 0, 0)
    })
    yPosition -= 30

    // Match Info
    page.drawText(`Match Count: ${candidate.match_count}`, {
      x: margin,
      y: yPosition,
      size: 12,
      font: helveticaFont,
      color: rgb(0, 0, 0)
    })
    yPosition -= 20

    page.drawText(`Matched Skills: ${candidate.matched_skills.join(', ')}`, {
      x: margin,
      y: yPosition,
      size: 10,
      font: helveticaFont,
      color: rgb(0, 0, 0)
    })
    yPosition -= 30

    // Skill Summary
    page.drawText('Skill Summary:', {
      x: margin,
      y: yPosition,
      size: 12,
      font: helveticaBold,
      color: rgb(0, 0, 0)
    })
    yPosition -= 20

    const sanitizedSummary = sanitizeTextForPDF(candidate.summary)
    const summaryLines = wrapText(sanitizedSummary, contentWidth, helveticaFont, 10)
    for (const line of summaryLines) {
      if (yPosition < margin + 50) break
      page.drawText(line, {
        x: margin,
        y: yPosition,
        size: 10,
        font: helveticaFont,
        color: rgb(0, 0, 0)
      })
      yPosition -= 15
    }
    yPosition -= 20

    // Detailed Feedback (JSONB data)
    if (candidate.feedback) {
      page.drawText('Feedback Assessment:', {
        x: margin,
        y: yPosition,
        size: 12,
        font: helveticaBold,
        color: rgb(0, 0, 0)
      })
      yPosition -= 20

      const formattedFeedback = formatFeedbackForPDF(candidate.feedback)
      const sanitizedFeedback = sanitizeTextForPDF(formattedFeedback)
      const feedbackLines = wrapText(sanitizedFeedback, contentWidth, helveticaFont, 9)
      for (const line of feedbackLines) {
        if (yPosition < margin + 50) break
        page.drawText(line, {
          x: margin,
          y: yPosition,
          size: 9,
          font: helveticaFont,
          color: rgb(0, 0, 0)
        })
        yPosition -= 12
      }
      yPosition -= 20
    }

    // Transcript
    page.drawText('Transcript:', {
      x: margin,
      y: yPosition,
      size: 12,
      font: helveticaBold,
      color: rgb(0, 0, 0)
    })
    yPosition -= 20

    const formattedTranscript = formatTranscriptForPDF(candidate.transcript)
    const sanitizedTranscript = sanitizeTextForPDF(formattedTranscript)
    const transcriptLines = wrapText(sanitizedTranscript, contentWidth, helveticaFont, 9)
    for (const line of transcriptLines) {
      if (yPosition < margin + 50) break
      page.drawText(line, {
        x: margin,
        y: yPosition,
        size: 9,
        font: helveticaFont,
        color: rgb(0, 0, 0)
      })
      yPosition -= 12
    }
  }

  return await pdfDoc.save()
}

function wrapText(text: string, maxWidth: number, font: any, fontSize: number): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let currentLine = ''

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word
    const testWidth = font.widthOfTextAtSize(testLine, fontSize)
    
    if (testWidth > maxWidth && currentLine) {
      lines.push(currentLine)
      currentLine = word
    } else {
      currentLine = testLine
    }
  }
  
  if (currentLine) {
    lines.push(currentLine)
  }
  
  return lines
} 