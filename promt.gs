/**
 * Prompt Templates for Iraqi Administrative Documents
 * Ported from React Application
 */

const PROMPTS = {
    SYSTEM_INSTRUCTION: `
    You are an expert Iraqi Administrative Assistant.
    Your task is to generate official Iraqi government documents (Kotob Rasmia).
    
    Formatting Rules:
    1. Use formal Arabic language (Fusha).
    2. Include "بسم الله الرحمن الرحيم" at the top center.
    3. Subject Line: "م / [Subject]" (Centered, Bold). Do NOT use "الموضوع:" or "Subject:".
    4. Salutation: "إلى / [Destination]" or "السيد / [Name]" (Right Aligned).
    5. Greeting: "تحية طيبة...".
    6. Body: Use passive or plural voice ("نود إعلامكم", "يرجى التفضل"). Clear, formal paragraphs.
    7. Closing: "للتفضل بالاطلاع... مع التقدير".
    8. Signature: Name & Title (Bottom Left).
  `,

    ANALYZE_REQUEST: (goal, currentDocContent) => `
    Analyze this request for an Iraqi administrative document:
    "${goal}"
    ${currentDocContent ? `\nContext from existing doc:\n${currentDocContent}` : ''}

    Identify ALL missing information specifically required for this TYPE of administrative document (e.g., for Job Application: Full Name, Degree, College; for Leave: Duration, Type, Date).
    
    stat STRICTLY: Result MUST be in Arabic language only.
    
    Return the output as a JSON object with this structure:
    {
      "questions": [
        "السؤال الأول؟",
        "السؤال الثاني؟",
        ...
      ]
    }
    `,

    GENERATE_TEMPLATE: (goal, answers, notes, ministry, docType = 'letter', includeTable = false) => `
    Generate a formal Iraqi document based on:
    Goal: "${goal}"
    Type: "${docType}" (Must be 'letter' or 'minutes')
    Force Table: ${includeTable} (If true, you MUST include a table in the response)
    ${notes ? `Important Notes: "${notes}"` : ''}
    ${answers ? `Additional Details:\n${answers}` : ''}
    Ministry Context: ${ministry}

    Strictly enforce Right-to-Left (RTL) Arabic formatting.

    Output JSON based on Type:

    IF Type is 'letter':
    {
      "doc_type": "letter",
      "subject": "String (Subject content ONLY)",
      "destination": "String (Addressee)",
      "body_text": "String (Main content. Use '[TABLE]' placeholder where a table should appear)",
      "tables": [
        {
          "headers": ["Col 1", "Col 2"],
          "rows": [["Row 1 Col 1", "Row 1 Col 2"], ["Row 2 Col 1", "Row 2 Col 2"]]
        }
      ],
      "signature_name": "String",
      "signature_title": "String"
    }

    IF Type is 'minutes' (محضر اجتماع):
    {
      "doc_type": "minutes",
      "meeting_title": "String (e.g., 'محضر اجتماع رقم 1 لسنة 2024')",
      "preamble": "String (Date, Time, Location, Chairman name)",
      "attendees": ["String (Name 1 - Role)", "String (Name 2 - Role)"],
      "agenda": ["String (Item 1)", "String (Item 2)"],
      "decisions": ["String (Decision 1)", "String (Decision 2)"],
      "committee_members": [
         {"name": "String", "role": "String (e.g. Member)"},
         {"name": "String", "role": "String (e.g. Chairman)"}
      ]
    }
  `
};
