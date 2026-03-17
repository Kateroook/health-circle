#!/usr/bin/env node

// Using built-in fetch available in Node.js 18+

const { GITHUB_TOKEN, GITHUB_REPOSITORY, PR_NUMBER, LLM7_API_KEY } = process.env;

if (!GITHUB_TOKEN || !GITHUB_REPOSITORY || !PR_NUMBER || !LLM7_API_KEY) {
  console.error('Missing required environment variables');
  process.exit(1);
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

async function getReview(diff, details) {
  const prompt = `
    You are an expert software engineer performing a code review for a project.
    PR Title: ${details.title}
    PR Number: #${PR_NUMBER}
    Description: ${details.body || 'No description provided.'}

    Instructions:
    Focus your review on:
    1. **Reusing existing components**: Are there new components that could be replaced by existing ones in the project?
    2. **Theme styles**: Is the code using predefined theme variables/styles or hardcoded values?
    3. **Bugs & Edge cases**: Are there any obvious bugs, race conditions, or unhandled error cases?
    4. **Best practices**: Is the code following clean code principles?
    5. **Performance**: Are there any potential performance bottlenecks?

    Please format your review as a friendly, constructive comment. Use Markdown.
    Start with a brief summary of the changes.
    Then list specific observations/suggestions.
    If everything looks great, say so!

    PR Diff:
    ${diff.substring(0, 10000)} // Limiting diff size for context limits
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
  const [diff, details] = await Promise.all([getPRDiff(), getPRDetails()]);

  const reviewContent = await getReview(diff, details);

  const finalComment = `
🤖 **AI Assistant PR Review** (triggered by /review)

${reviewContent}
  `.trim();

  await submitReview(finalComment);
  console.log('Review submitted successfully!');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
