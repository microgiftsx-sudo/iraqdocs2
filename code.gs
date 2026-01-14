/**
 * Google Docs Add-on: Smart Iraqi Administrative Generator
 * Main Server-Side Code
 */

function onOpen() {
    DocumentApp.getUi()
        .createMenu('المولد العراقي الذكي')
        .addItem('فتح الأداة', 'showSidebar')
        .addToUi();
}

function showSidebar() {
    const html = HtmlService.createHtmlOutputFromFile('sidebar-modern')
        .setTitle('المولد العراقي الذكي')
        .setWidth(350); // Slightly wider for better UX
    DocumentApp.getUi().showSidebar(html);
}

// --- API Key Management ---
function saveApiKey(key) {
    PropertiesService.getUserProperties().setProperty('GEMINI_API_KEY', key);
    return 'تم حفظ مفتاح API بنجاح!';
}

function getApiKey() {
    return PropertiesService.getUserProperties().getProperty('GEMINI_API_KEY') || '';
}

// --- Document Analysis ---
function getCurrentDocContent() {
    const doc = DocumentApp.getActiveDocument();
    const body = doc.getBody();
    return body.getText();
}

function analyzeRequest(goal, useCurrentDocContext) {
    const apiKey = getApiKey();
    if (!apiKey) throw new Error('يرجى إدخال مفتاح API في الإعدادات أولاً.');

    let context = "";
    if (useCurrentDocContext) {
        context = getCurrentDocContent();
    }

    const prompt = PROMPTS.SYSTEM_INSTRUCTION + "\n\n" +
        PROMPTS.ANALYZE_REQUEST(goal, context);

    let generatedText = callGemini(apiKey, prompt);
    generatedText = cleanJson(generatedText);

    try {
        const result = JSON.parse(generatedText);
        return result.questions || [];
    } catch (e) {
        // Fallback if analysis fails JSON parse
        return ["يرجى تزويدنا بمزيد من التفاصيل حول الطلب."];
    }
}

// --- Gemini Generation ---
// Helper for API calls
function callGemini(apiKey, prompt) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const payload = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { 
            responseMimeType: "text/plain" // Change to text/plain to avoid forced structure issues, we parse manually
        }
    };

    try {
        const response = UrlFetchApp.fetch(url, {
            method: 'post',
            contentType: 'application/json',
            payload: JSON.stringify(payload)
        });
        const json = JSON.parse(response.getContentText());
        let rawText = json.candidates[0].content.parts[0].text;
        return rawText;
    } catch (e) {
        Logger.log(e);
        throw new Error("فشل الاتصال بـ Gemini: " + e.message);
    }
}

function cleanJson(text) {
    // Remove markdown code blocks ```json ... ``` or just ``` ... ```
    text = text.replace(/```json/g, '').replace(/```/g, '');
    // Provide a fallback if cleanup leaves whitespace
    return text.trim();
}

function generateDocument(userGoal, answers, ministry, notes, useCurrentDocContext, docType = 'letter', includeTable = false) {
    const apiKey = getApiKey();
    if (!apiKey) throw new Error('يرجى إدخال مفتاح API في الإعدادات أولاً.');

    const prompt = PROMPTS.SYSTEM_INSTRUCTION + "\n\n" +
        PROMPTS.GENERATE_TEMPLATE(userGoal, answers, notes, ministry, docType, includeTable);

    let generatedText = callGemini(apiKey, prompt);
    generatedText = cleanJson(generatedText);
    
    let docData;
    try {
        docData = JSON.parse(generatedText);
    } catch (e) {
        throw new Error("فشل في تحليل استجابة الذكاء الاصطناعي check Logger");
    }

    // Validation
    if (!docData) {
        throw new Error("لم يتمكن النظام من توليد نص المستند. حاول مرة أخرى.");
    }

    writedocDataToDocs(docData);
    return "تم إنشاء المستند بنجاح!";
}

// --- Writing to Google Docs ---
function writedocDataToDocs(data) {
    const doc = DocumentApp.getActiveDocument();
    const body = doc.getBody();

    // --- Page Setup (Iraqi Filing Standards) ---
    // Right margin wider for punching/filing
    body.setMarginRight(50); 
    body.setMarginLeft(30);
    body.setMarginTop(30);
    body.setMarginBottom(30);

    // Smart Font Matching
    let targetFont = 'Amiri'; // Default Fallback
    const paragraphs = body.getParagraphs();
    if (paragraphs.length > 0) {
       for(let p of paragraphs) {
           const text = p.getText().trim();
           if(text.length > 0) {
               const font = p.getFontFamily();
               if(font) {
                   targetFont = font;
                   break;
               }
           }
       }
    }

    const setStyle = (element) => {
        element.editAsText().setFontFamily(targetFont);
        if(element.getType() == DocumentApp.ElementType.PARAGRAPH) {
            element.setLeftToRight(false); // STRICT RTL
        }
        return element;
    };

    // --- BRANCH: Meeting Minutes ---
    if (data.doc_type === 'minutes') {
        // 1. Title
        const title = body.appendParagraph(data.meeting_title);
        setStyle(title);
        title.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
        title.setHeading(DocumentApp.ParagraphHeading.HEADING2);
        title.setBold(true);

        // 2. Preamble
        const preamble = body.appendParagraph(data.preamble);
        setStyle(preamble);
        preamble.setAlignment(DocumentApp.HorizontalAlignment.JUSTIFY);

        // 3. Attendees
        body.appendParagraph("الحاضرون:").setBold(true).setLeftToRight(false).editAsText().setFontFamily(targetFont);
        if (data.attendees && data.attendees.length > 0) {
            for (let attendee of data.attendees) {
                const p = body.appendParagraph(`- ${attendee}`);
                setStyle(p);
            }
        }

        // 4. Agenda
        if (data.agenda && data.agenda.length > 0) {
            body.appendParagraph("\nجدول الأعمال:").setBold(true).setLeftToRight(false).editAsText().setFontFamily(targetFont);
            for (let i = 0; i < data.agenda.length; i++) {
                const p = body.appendParagraph(`${i + 1}. ${data.agenda[i]}`);
                setStyle(p);
            }
        }

        // 5. Decisions / Recommendations
        if (data.decisions && data.decisions.length > 0) {
            body.appendParagraph("\nالقرارات والتوصيات:").setBold(true).setLeftToRight(false).editAsText().setFontFamily(targetFont);
            for (let i = 0; i < data.decisions.length; i++) {
                const p = body.appendParagraph(`${i + 1}. ${data.decisions[i]}`);
                setStyle(p);
                p.setAlignment(DocumentApp.HorizontalAlignment.JUSTIFY);
            }
        }

        // 6. Committee Signatures (Table)
        body.appendParagraph("\n\n");
        const members = data.committee_members || [];
        if (members.length > 0) {
            const table = body.appendTable();
            table.setBorderWidth(0);
            
            // Create rows based on number of members (e.g. 3 per row)
            let row = table.appendTableRow();
            for (let i = 0; i < members.length; i++) {
                const member = members[i];
                if (i > 0 && i % 3 === 0) row = table.appendTableRow(); // New row every 3 members
                
                const cell = row.appendTableCell();
                cell.setWidth(150);
                
                const nameP = cell.appendParagraph(member.name);
                nameP.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
                nameP.setBold(true);
                nameP.editAsText().setFontFamily(targetFont);

                const roleP = cell.appendParagraph(member.role);
                roleP.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
                roleP.editAsText().setFontFamily(targetFont);
            }
        }
        return; // End of Minutes Logic
    }

    // --- BRANCH: Official Letter (Default) ---

    // 1. Subject (Title)
    let cleanSubject = data.subject.replace(/^(م\s*\/)+/, '').trim(); 
    cleanSubject = cleanSubject.replace(/^( الموضوع:|Subject:)/, '').trim();

    const subject = body.appendParagraph(`م / ${cleanSubject}`);
    setStyle(subject);
    subject.setHeading(DocumentApp.ParagraphHeading.HEADING3);
    subject.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    subject.setBold(true);

    // 2. Destination (To...)
    if (data.destination) {
        body.appendParagraph("");
        const dest = body.appendParagraph(data.destination);
        setStyle(dest);
        dest.setHeading(DocumentApp.ParagraphHeading.NORMAL);
        dest.setIndentStart(0); 
        dest.setIndentFirstLine(0);
        dest.setAlignment(DocumentApp.HorizontalAlignment.RIGHT);
        dest.setBold(true);
        dest.setFontSize(14);
    }

    // 3. Body with Smart Table Support
    body.appendParagraph("\n"); 
    
    // Check for [TABLE] placeholder
    const parts = data.body_text.split('[TABLE]');
    
    // Part 0: Text before table
    if (parts[0]) {
        const bodyText = body.appendParagraph(parts[0]);
        setStyle(bodyText);
        bodyText.setAlignment(DocumentApp.HorizontalAlignment.JUSTIFY);
        bodyText.setLineSpacing(1.15);
    }

    // If we have a table placeholder and actual table data
    if (parts.length > 1 && data.tables && data.tables.length > 0) {
        const tableData = data.tables[0]; // Currently supports 1 table
        // Create Table
        const docTable = body.appendTable();
        
        // Header Row
        if (tableData.headers) {
             const headerRow = docTable.appendTableRow();
             for (let header of tableData.headers) {
                 const cell = headerRow.appendTableCell(header);
                 cell.setBackgroundColor('#f3f3f3'); // Light Gray Header
                 const p = cell.getChild(0).asParagraph();
                 p.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
                 p.setBold(true);
                 p.editAsText().setFontFamily(targetFont);
             }
        }

        // Data Rows
        if (tableData.rows) {
            for (let rowData of tableData.rows) {
                const docRow = docTable.appendTableRow();
                for (let cellData of rowData) {
                    const cell = docRow.appendTableCell(cellData);
                    const p = cell.getChild(0).asParagraph();
                    p.setAlignment(DocumentApp.HorizontalAlignment.CENTER); // Center data
                    p.editAsText().setFontFamily(targetFont);
                }
            }
        }
         // Set Borders - 1pt Black
        docTable.setBorderWidth(1);
        docTable.setBorderColor('#000000');
    }

    // Part 1: Text after table
    if (parts[1]) {
        const bodyTextAfter = body.appendParagraph(parts[1]);
        setStyle(bodyTextAfter);
        bodyTextAfter.setAlignment(DocumentApp.HorizontalAlignment.JUSTIFY);
        bodyTextAfter.setLineSpacing(1.15);
    }

    // 4. Signature (Left)
    body.appendParagraph("\n\n\n");
    
    const sigTable = body.appendTable();
    sigTable.setBorderWidth(0);
    const sigRow = sigTable.appendTableRow();
    
    // Default LTR: Col 0 (Left) = Signature, Col 1 (Right) = Spacer
    
    const sigCell = sigRow.appendTableCell();
    sigCell.setWidth(200); // Signature Left
    
    const sigName = sigCell.insertParagraph(0, data.signature_name);
    sigName.editAsText().setFontFamily(targetFont);
    sigName.setBold(true);
    sigName.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    
    const sigTitle = sigCell.appendParagraph(data.signature_title);
    sigTitle.editAsText().setFontFamily(targetFont);
    sigTitle.setAlignment(DocumentApp.HorizontalAlignment.CENTER);

    const spacerCell = sigRow.appendTableCell();
    spacerCell.setText("");
    spacerCell.setWidth(250);
}
