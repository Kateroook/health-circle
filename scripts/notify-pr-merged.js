#!/usr/bin/env node

// Using built-in fetch available in Node.js 18+

const { TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, LLM7_API_KEY, PR_NUMBER, PR_TITLE, PR_BODY, BRANCH_NAME, COMMITS_JSON } =
  process.env;

if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID || !LLM7_API_KEY) {
  console.error('Missing required environment variables');
  process.exit(1);
}

async function getSummary(title, body, commits) {
  const prompt = `
    You are a helpful assistant that summarizes GitHub Pull Requests for a Telegram notification.
    PR Title: ${title}
    PR Number: #${PR_NUMBER}
    Target Branch: ${BRANCH_NAME}
    
    Description:
    ${body || 'No description provided.'}
    
    Commits:
    ${commits}
    
    Please provide a concise summary of the changes in this PR. 
    Focus on "What was changed" and "Why".
    Keep it short enough for a Telegram message (around 2-3 sentences).
    Format the output as a single string of text.
  `;

  try {
    const response = await fetch('https://api.llm7.io/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${LLM7_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat', // Assuming deepseek-chat is available on llm7.io
        messages: [
          { role: 'system', content: 'You are a technical documentation assistant.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error fetching summary from llm7.io:', error);
    return 'Summary not available.';
  }
}

async function sendTelegramMessage(message) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'Markdown',
      }),
    });
    const data = await response.json();
    if (!data.ok) {
      console.error('Telegram API error:', data);
    }
  } catch (error) {
    console.error('Error sending Telegram message:', error);
  }
}

async function main() {
  const commits = JSON.parse(COMMITS_JSON || '[]');
  const commitMessages = commits.map((c) => `- ${c.message}`).join('\n');

  const summary = await getSummary(PR_TITLE, PR_BODY, commitMessages);

  const telegramMessage = `
🚀 *PR #${PR_NUMBER} Merged to ${BRANCH_NAME}*

*Title:* ${PR_TITLE}

*Summary:*
${summary}

*Commits:*
${commitMessages}

[View PR](https://github.com/${process.env.GITHUB_REPOSITORY}/pull/${PR_NUMBER})
  `.trim();

  await sendTelegramMessage(telegramMessage);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
