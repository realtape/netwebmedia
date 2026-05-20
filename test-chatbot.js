#!/usr/bin/env node

/**
 * Automated Chatbot Test Suite — 10 Prospect Questions
 * Tests /api/public/chat (website widget) for relevance, hallucination, and rate limiting
 *
 * Usage: node test-chatbot.js [test-name]
 *   node test-chatbot.js                    — run full suite
 *   node test-chatbot.js rate-limit         — test rate limit (20 msgs/IP/24h)
 *   node test-chatbot.js single-test-3      — run only question #3
 */

const BASE_URL = 'https://netwebmedia.com/api/public/chat';
const SESSION_ID = `test_${Date.now()}_${Math.random().toString(36).substring(7)}`;

const QUESTIONS = [
  {
    id: 1,
    category: 'Service Overview',
    text: 'What services does NetWebMedia offer?',
    keywords: ['AI', 'automation', 'lead', 'marketing'],
    shouldNotContain: ['ChatGPT', 'HubSpot pricing', 'Zapier only'],
  },
  {
    id: 2,
    category: 'Pricing & Affordability',
    text: 'How much does NetWebMedia cost? Do you have plans for small businesses?',
    keywords: ['pricing', 'plans', 'scalable', 'affordable'],
    shouldNotContain: ['$99/month', '$999/month', 'exact price'],
  },
  {
    id: 3,
    category: 'Implementation Timeline',
    text: 'How long does it take to set up NetWebMedia for my business?',
    keywords: ['days', 'weeks', 'timeline', 'setup', 'implementation'],
    shouldNotContain: ['6 months', 'years'],
  },
  {
    id: 4,
    category: 'AI Capabilities',
    text: 'What can your AI actually automate? Can it handle customer support?',
    keywords: ['automate', 'support', 'qualify', 'email'],
    shouldNotContain: ['ChatGPT', 'just like'],
  },
  {
    id: 5,
    category: 'Integration & Tech Stack',
    text: 'Does NetWebMedia integrate with our CRM? We use HubSpot.',
    keywords: ['integration', 'API', 'CRM', 'HubSpot'],
    shouldNotContain: ['HubSpot is our CRM', 'we own HubSpot'],
  },
  {
    id: 6,
    category: 'Proof of Results',
    text: 'Do you have case studies? What kind of ROI should we expect?',
    keywords: ['case study', 'results', 'audit', 'niche'],
    shouldNotContain: ['100% ROI', 'guaranteed', 'everyone gets'],
  },
  {
    id: 7,
    category: 'Data Privacy & Security',
    text: 'Is my customer data secure with NetWebMedia? GDPR compliant?',
    keywords: ['secure', 'compliance', 'GDPR', 'privacy'],
    shouldNotContain: ['we ignore GDPR', 'no encryption'],
  },
  {
    id: 8,
    category: 'Feature Requests / Limitations',
    text: 'Can your system handle video synthesis? What can\'t you do?',
    keywords: ['video', 'feature', 'limitation', 'scope'],
    shouldNotContain: ['all features', 'everything works'],
  },
  {
    id: 9,
    category: 'Getting Started / Free Trial',
    text: 'How do I get started? Is there a free trial or free audit?',
    keywords: ['started', 'free', 'audit', 'contact', 'pricing'],
    shouldNotContain: ['no free options', 'pay first'],
  },
  {
    id: 10,
    category: 'Support & Availability',
    text: 'Do you have phone support? What\'s your response time?',
    keywords: ['support', 'email', 'response', 'WhatsApp'],
    shouldNotContain: ['24/7 phone', 'instant response', '1 hour'],
  },
];

/**
 * Send a single question to the chatbot API
 */
async function askChatbot(question, questionIndex) {
  const payload = {
    message: question.text,
    language: 'en',
    session_id: SESSION_ID,
    page: '/test',
  };

  try {
    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    return {
      ok: true,
      status: response.status,
      data: data,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      ok: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Validate response against question criteria
 */
function validateResponse(question, response) {
  const issues = [];
  const warnings = [];

  if (!response.ok) {
    issues.push(`API error: ${response.error}`);
    return { pass: false, issues, warnings };
  }

  if (response.status !== 200) {
    issues.push(`Unexpected status: ${response.status}`);
  }

  const reply = response.data.reply || '';

  // Check for hallucinations
  if (question.shouldNotContain) {
    for (const badPhrase of question.shouldNotContain) {
      if (reply.toLowerCase().includes(badPhrase.toLowerCase())) {
        issues.push(`Hallucination detected: "${badPhrase}"`);
      }
    }
  }

  // Check for key topics
  if (question.keywords && question.keywords.length > 0) {
    const foundKeywords = question.keywords.filter(kw =>
      reply.toLowerCase().includes(kw.toLowerCase())
    );
    if (foundKeywords.length === 0) {
      warnings.push(`No expected keywords found (expected one of: ${question.keywords.join(', ')})`);
    }
  }

  // Check length (should be 2-4 paragraphs, roughly 100-500 chars)
  if (reply.length < 50) {
    warnings.push(`Response too short (${reply.length} chars)`);
  }
  if (reply.length > 1500) {
    warnings.push(`Response too long (${reply.length} chars, aim for <500)`);
  }

  // Check for CTA (link, suggestion, or email)
  const hasCTA = reply.includes('/') || reply.includes('.com') || reply.includes('hello@') ||
                 reply.includes('contact') || reply.includes('pricing') || reply.includes('audit');
  if (!hasCTA) {
    warnings.push('No clear CTA detected (no link, email, or action suggested)');
  }

  // Check for rate limit response
  if (response.data.rate_limited) {
    issues.push('Rate limit triggered');
  }

  return {
    pass: issues.length === 0,
    issues,
    warnings,
  };
}

/**
 * Format and print a test result
 */
function printResult(question, response, validation, index, total) {
  const statusEmoji = validation.pass ? '✅' : '❌';
  const warningEmoji = validation.warnings.length > 0 ? '⚠️' : '';

  console.log(`\n${statusEmoji} [${index}/${total}] ${question.category}`);
  console.log(`   Q: "${question.text.substring(0, 70)}..."`);

  if (validation.issues.length > 0) {
    console.log(`   ❌ Issues:`);
    validation.issues.forEach(issue => console.log(`      - ${issue}`));
  }

  if (validation.warnings.length > 0) {
    console.log(`   ${warningEmoji} Warnings:`);
    validation.warnings.forEach(warn => console.log(`      - ${warn}`));
  }

  if (validation.pass && validation.warnings.length === 0) {
    console.log(`   ✓ Response OK (${response.data.reply.length} chars)`);
  }

  if (response.data.suggested_actions && response.data.suggested_actions.length > 0) {
    console.log(`   → Suggested actions: ${response.data.suggested_actions.map(a => a.label).join(', ')}`);
  }
}

/**
 * Run full test suite
 */
async function runFullSuite() {
  console.log(`\n🧪 NetWebMedia Chatbot Test Suite`);
  console.log(`Session: ${SESSION_ID}`);
  console.log(`Endpoint: ${BASE_URL}`);
  console.log(`Questions: ${QUESTIONS.length}\n`);

  const results = [];
  const startTime = Date.now();

  for (let i = 0; i < QUESTIONS.length; i++) {
    const question = QUESTIONS[i];
    console.log(`\n[${i + 1}/${QUESTIONS.length}] Sending: "${question.text.substring(0, 60)}..."`);

    const response = await askChatbot(question, i);
    const validation = validateResponse(question, response);

    results.push({
      question,
      response,
      validation,
    });

    printResult(question, response, validation, i + 1, QUESTIONS.length);

    // Rate limiting: pause 100ms between requests to not trigger rate limit
    if (i < QUESTIONS.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  const elapsed = Date.now() - startTime;
  const passed = results.filter(r => r.validation.pass).length;
  const warned = results.filter(r => r.validation.warnings.length > 0).length;

  console.log(`\n\n📊 Summary`);
  console.log(`────────────────────────────────`);
  console.log(`Passed:  ${passed}/${QUESTIONS.length}`);
  console.log(`Warned:  ${warned}/${QUESTIONS.length}`);
  console.log(`Failed:  ${QUESTIONS.length - passed}/${QUESTIONS.length}`);
  console.log(`Time:    ${(elapsed / 1000).toFixed(1)}s`);
  console.log(`Average: ${(elapsed / QUESTIONS.length).toFixed(0)}ms/question\n`);

  return results;
}

/**
 * Test rate limiting by sending 21+ rapid messages
 */
async function testRateLimit() {
  console.log(`\n🔒 Rate Limit Test (20 msgs/IP/24h)\n`);

  const rateLimitSessionId = `ratelimit_${Date.now()}`;
  let hitLimit = false;

  for (let i = 1; i <= 25; i++) {
    const payload = {
      message: `Test message #${i}`,
      language: 'en',
      session_id: rateLimitSessionId,
    };

    try {
      const response = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.rate_limited) {
        console.log(`✅ Rate limit triggered at message #${i}`);
        console.log(`   Response: "${data.reply.substring(0, 80)}..."`);
        hitLimit = true;
        break;
      } else {
        console.log(`[${i}] OK (${response.status})`);
      }
    } catch (error) {
      console.log(`[${i}] Error: ${error.message}`);
      break;
    }

    await new Promise(resolve => setTimeout(resolve, 50));
  }

  if (!hitLimit) {
    console.log(`\n⚠️  Rate limit was NOT triggered after 25 messages. Check enforcement.`);
  }
}

/**
 * Run a single test by question number
 */
async function runSingleTest(questionIndex) {
  const index = parseInt(questionIndex, 10) - 1;
  if (index < 0 || index >= QUESTIONS.length) {
    console.log(`❌ Question index out of range (1-${QUESTIONS.length})`);
    process.exit(1);
  }

  const question = QUESTIONS[index];
  console.log(`\n🧪 Single Test: #${index + 1} — ${question.category}\n`);

  const response = await askChatbot(question, index);
  const validation = validateResponse(question, response);

  printResult(question, response, validation, index + 1, QUESTIONS.length);

  console.log(`\n📄 Full Response:`);
  console.log(`───────────────────────────────`);
  console.log(response.data.reply);
  console.log(`\n`);

  if (response.data.suggested_actions && response.data.suggested_actions.length > 0) {
    console.log(`🔗 Suggested Actions:`);
    response.data.suggested_actions.forEach(a => {
      console.log(`   - ${a.label}: ${a.href}`);
    });
  }

  console.log(`\n`);
}

/**
 * Main CLI
 */
async function main() {
  const arg = process.argv[2];

  if (arg === 'rate-limit') {
    await testRateLimit();
  } else if (arg && arg.startsWith('single-test-')) {
    const questionIndex = arg.replace('single-test-', '');
    await runSingleTest(questionIndex);
  } else {
    await runFullSuite();
  }
}

main().catch(console.error);
