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
    const contextPath = path.join(__dirname, '../docs/pr-review-context.md');
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
    Your goal is to provide a detailed, educational, and strict code review based on our project guidelines.

    ### PROJECT CONTEXT & GUIDELINES:
    ${context}

    ### PR INFORMATION:
    PR Title: ${details.title}
    PR Number: #${PR_NUMBER}
    Description: ${details.body || 'No description provided.'}

    ### CORE FOCUS AREAS:

    1. **SECURITY & SECRETS (CRITICAL)**:
       - Check for "google-services.json" or "GoogleService-Info.plist" being added to the codebase. 
       - Check for hardcoded API keys, tokens, or sensitive URLs.
       - If found, stop everything and warn the user immediately.

    2. **COMPONENT REUSE & DRY**:
       - Refer to the "Key Components" section in the project context.
       - NEVER allow creating a new UI element if a standardized component exists.
       - Specifically watch out for custom TouchableOpacity, View, or Text components that should be using Button, ListItem, or Typography.

    3. **THEME & STYLING**:
       - Refer to the "Theme & Styling" section in the project context.
       - Reject any hardcoded colors, spacing, or radius values.
       - Ensure \`StyleSheet.create\` is used for all styles.

    4. **EXPO & REACT NATIVE BEST PRACTICES**:
       - **hooks**: Check for missing dependency arrays in useEffect/useCallback or \`useMemo\`.
       - **performance**: Check for heavy computations inside the render body.
       - **Expo APIs**: Prefer Expo SDK libraries over bare React Native ones where applicable (e.g., Expo Image vs RN Image).

    5. **AI MISTAKES & DELTA CHECK**:
       - **Function Moving**: Did the AI move a function for no reason? If it didn't change the logic, ask why it was moved.
       - **Deletions**: Check if the code accidentally deleted comments, helper functions, or formatting that was unrelated to the task.
       - **Typos**: Look for typical AI-generated typos or variable naming inconsistencies (e.g., mixing camelCase and snake_case).
       - **Placeholders**: Look for "TODO", "FIXME", or placeholder text left behind.

    ### OUTPUT FORMAT:
    - Start with a quick "Overall Impression".
    - Use clear headings for each category.
    - Be specific: cite the file and line if possible (from the diff).
    - Be constructive: don't just say "it's wrong", explain *why* and *how to fix it*.
    - Keep the tone professional yet encouraging.

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
