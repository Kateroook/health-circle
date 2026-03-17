#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const { GITHUB_TOKEN, GITHUB_REPOSITORY, PR_NUMBER, LLM7_API_KEY, COMMENT_ID } = process.env;

if (!GITHUB_TOKEN || !GITHUB_REPOSITORY || !PR_NUMBER || !LLM7_API_KEY) {
  console.error('Missing required environment variables');
  process.exit(1);
}

function getProjectContext() {
  try {
    const contextPath = path.join(__dirname, '../docs/pr-review-guidelines.md');
    if (fs.existsSync(contextPath)) {
      return fs.readFileSync(contextPath, 'utf8');
    }
  } catch (error) {
    console.error('Error reading project context:', error);
  }
  return '';
}

async function addReaction(commentId, content) {
  if (!commentId) return;
  const url = `https://api.github.com/repos/${GITHUB_REPOSITORY}/issues/comments/${commentId}/reactions`;
  try {
    await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
        Accept: 'application/vnd.github.bolt-preview+json', // Required for reactions API
      },
      body: JSON.stringify({ content }),
    });
  } catch (error) {
    console.error('Error adding reaction:', error);
  }
}

async function getPRDiff() {
  const url = `https://api.github.com/repos/${GITHUB_REPOSITORY}/pulls/${PR_NUMBER}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github.v3.diff',
    },
  });
  return await response.text();
}

async function getPRDetails() {
  const url = `https://api.github.com/repos/${GITHUB_REPOSITORY}/pulls/${PR_NUMBER}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      Accept: 'application/json',
    },
  });
  return await response.json();
}

async function submitReview(body) {
  const url = `https://api.github.com/repos/${GITHUB_REPOSITORY}/pulls/${PR_NUMBER}/reviews`;
  await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      'Content-Type': 'application/json',
      Accept: 'application/vnd.github.v3+json',
    },
    body: JSON.stringify({
      body,
      event: 'COMMENT', // Can be 'APPROVE', 'REQUEST_CHANGES', or 'COMMENT'
    }),
  });
}

async function getReview(diff, details, context) {
  const prompt = `
    You are a Senior Software Engineer acting as a mentor for a developer. 
    The developer is relatively new to React Native and Expo and relies heavily on AI assistance.
    Your goal is to provide a detailed, educational, and STRICT code review based on our project guidelines.

    ### PROJECT CONTEXT & GUIDELINES:
    // Important: The following content is the project context read from docs/pr-review-guidelines.md
    ${context}

    ### PR INFORMATION:
    PR Title: ${details.title}
    PR Number: #${PR_NUMBER}
    Description: ${details.body || 'No description provided.'}

    ### CORE FOCUS AREAS & RULES:

    1. **SECURITY & SECRETS (FATAL IF FOUND)**:
       - Check for "google-services.json" or "GoogleService-Info.plist" being added to the codebase. 
       - Check for hardcoded API keys, tokens, or sensitive URLs.
       - If found, stop everything and warn the user immediately with a 🚨 CRITICAL warning.

    2. **STRICT COMPONENT REUSE**:
       - Refer to the "Key Components" section in the project context.
       - If the user writes custom TouchableOpacity, View, or Text components for elements that should be Button, ListItem, or Typography, you MUST reject the change and show them which component to use.
       - DO NOT allow any "one-off" UI elements that violate our design system.

    3. **THEME ADHERENCE**:
       - Refer to the "Theme & Styling" section in the project context.
       - Reject ANY hardcoded HEX colors, hardcoded spacing (e.g., 20, 15), or ad-hoc radius values.
       - Ensure \`StyleSheet.create\` is used. Do not accept inline styles for anything more than a simple conditional.

    4. **AI MISTAKES & DELTA NOISE**:
       - **Unnecessary Moves**: If the AI moved a function but didn't change it, identify it as "Noise" and ask to revert it.
       - **Accidental Deletions**: Check if helper functions, unrelated comments, or exports were deleted by mistake.
       - **AI Hallucinations**: Look for imaginary props or inconsistently named variables.

    5. **EXPO & RN BEST PRACTICES**:
       - Ensure dependency arrays in hooks like \`useMemo\`, \`useCallback\`, and \`useEffect\` are present and accurate.
       - Suggest \`expo-image\` for performance-critical image loading.

    ### YOUR OUTPUT FORMAT:

    1. **Overall Impression**: A 1-2 sentence summary.
    2. **🚨 Mandatory Checklist**:
       - [ ] No secrets found
       - [ ] Component reuse verified
       - [ ] Theme adherence verified
    3. **Mentorship Findings**:
       - Group by category (Security, Components, Styling, etc.).
       - For each finding: Cite file/line, explain the mistake, and provide the correct code snippet from our project.
    4. **AI Noise Check**: List any unnecessary moves or deletions.

    PR Diff:
    ${diff.substring(0, 15000)} 
  `;

  try {
    const response = await fetch('https://api.llm7.io/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${LLM7_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: 'You are a senior software engineer.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.2,
      }),
    });

    const data = await response.json();
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error fetching review from llm7.io:', error);
    return 'Failed to generate automated review.';
  }
}

async function main() {
  console.log(`Starting review for PR #${PR_NUMBER}...`);
  if (COMMENT_ID) {
    await addReaction(COMMENT_ID, 'eyes');
  }

  const [diff, details] = await Promise.all([getPRDiff(), getPRDetails()]);
  const context = getProjectContext();

  const reviewContent = await getReview(diff, details, context);

  const finalComment = `
🤖 **AI Assistant PR Review** (triggered by /review)

${reviewContent}
  `.trim();

  await submitReview(finalComment);

  if (COMMENT_ID) {
    await addReaction(COMMENT_ID, 'rocket');
  }

  console.log('Review submitted successfully!');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
