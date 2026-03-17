#!/usr/bin/env node

// Using built-in fetch available in Node.js 18+

const { LLM7_API_KEY, COMMITS_JSON } = process.env;

if (!LLM7_API_KEY) {
  console.error('Missing LLM7_API_KEY');
  process.exit(1);
}

async function getSummary(commits) {
  const prompt = `
    You are a helpful assistant that summarizes changes for an Android build notification.
    
    Commits since last successful build:
    ${commits}
    
    Please provide a concise "What's Changed" summary. 
    Group them into:
    - 🚀 Features
    - 🐞 Bug Fixes
    - 🛠 Refactors/Other (if any)
    
    Keep it very brief (bullet points). 
    If there are no commits, say "No code changes recorded."
    Format the output for a Telegram Markdown message.
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
          { role: 'system', content: 'You are a technical documentation assistant.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
      }),
    });

    const data = await response.json();
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error fetching summary from llm7.io:', error);
    return 'Summary not available.';
  }
}

async function main() {
  const commits = JSON.parse(COMMITS_JSON || '[]');
  if (commits.length === 0) {
    process.stdout.write('No code changes since last build.');
    return;
  }

  const commitMessages = commits.map((c) => `- ${c.message}`).join('\n');
  const summary = await getSummary(commitMessages);

  process.stdout.write(summary);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
