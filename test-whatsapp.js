#!/usr/bin/env node

/**
 * Automated WhatsApp Test Suite — 10 Prospect Questions
 * Tests /api/whatsapp/webhook (Twilio path) for relevance, hallucination, and rate limiting
 *
 * Usage: node test-whatsapp.js [test-name]
 *   node test-whatsapp.js                    — run full suite
 *   node test-whatsapp.js rate-limit         — test rate limit (50 msgs/phone/24h)
 *   node test-whatsapp.js single-test-3      — run only question #3
 */

const BASE_URL = 'https://netwebmedia.com/api/whatsapp/webhook';

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
 * Send a single question via Twilio WhatsApp webhook
 */
async function askWhatsApp(question, questionIndex) {
  // Use different phone numbers per question to avoid rate-limit within conversation
  const testPhone = `55199990000${String(questionIndex + 1).padStart(2, '0')}`;

  // Format as Twilio webhook POST (application/x-www-form-urlencoded)
  const payload = new URLSearchParams({
    From: `whatsapp:${testPhone}`,
    To: 'whatsapp:+1234567890', // Dummy destination
    Body: question.text,
  });

  try {
    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: payload.toString(),
    });

    const text = await response.text();

    // Parse TwiML response to extract message
    const msgMatch = text.match(/<Message>(.*?)<\/Message>/s);
    const reply = msgMatch ? msgMatch[1] : '';

    return {
      ok: true,
      status: response.status,
      phone: testPhone,
      reply: reply,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      ok: false,
      phone: testPhone,
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

  const reply = response.reply || '';

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

  // Check length (WhatsApp should be under 2-3 messages, roughly 50-400 chars to fit mobile)
  if (reply.length < 30) {
    warnings.push(`Response too short (${reply.length} chars)`);
  }
  if (reply.length > 1000) {
    warnings.push(`Response too long (${reply.length} chars, aim for <400)`);
  }

  // Check for CTA (link, email, or action)
  const hasCTA = reply.includes('http') || reply.includes('.com') || reply.includes('hello@') ||
                 reply.includes('contact') || reply.includes('pricing') || reply.includes('audit') ||
                 reply.includes('email');
  if (!hasCTA) {
    warnings.push('No clear CTA detected (no link, email, or action suggested)');
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
  console.log(`   📱 From: ${response.phone}`);

  if (validation.issues.length > 0) {
    console.log(`   ❌ Issues:`);
    validation.issues.forEach(issue => console.log(`      - ${issue}`));
  }

  if (validation.warnings.length > 0) {
    console.log(`   ${warningEmoji} Warnings:`);
    validation.warnings.forEach(warn => console.log(`      - ${warn}`));
  }

  if (validation.pass && validation.warnings.length === 0) {
    console.log(`   ✓ Response OK (${response.reply.length} chars)`);
  }
}

/**
 * Run full test suite
 */
async function runFullSuite() {
  console.log(`\n🧪 NetWebMedia WhatsApp Test Suite`);
  console.log(`Endpoint: ${BASE_URL}`);
  console.log(`Questions: ${QUESTIONS.length}`);
  console.log(`Provider: Twilio\n`);

  const results = [];
  const startTime = Date.now();

  for (let i = 0; i < QUESTIONS.length; i++) {
    const question = QUESTIONS[i];
    console.log(`\n[${i + 1}/${QUESTIONS.length}] Sending: "${question.text.substring(0, 60)}..."`);

    const response = await askWhatsApp(question, i);
    const validation = validateResponse(question, response);

    results.push({
      question,
      response,
      validation,
    });

    printResult(question, response, validation, i + 1, QUESTIONS.length);

    // Rate limiting: pause 200ms between requests (WhatsApp is slower)
    if (i < QUESTIONS.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 200));
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
 * Test rate limiting by sending 51+ rapid messages from same phone
 */
async function testRateLimit() {
  console.log(`\n🔒 Rate Limit Test (50 msgs/phone/24h)\n`);

  const testPhone = '551999900099'; // Same phone for all rate-limit test messages
  let hitLimit = false;

  for (let i = 1; i <= 55; i++) {
    const payload = new URLSearchParams({
      From: `whatsapp:${testPhone}`,
      To: 'whatsapp:+1234567890',
      Body: `Test message #${i}`,
    });

    try {
      const response = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: payload.toString(),
      });

      const text = await response.text();
      const msgMatch = text.match(/<Message>(.*?)<\/Message>/s);
      const reply = msgMatch ? msgMatch[1] : '';

      // Check if this is the rate-limit response
      if (reply.includes("message limit") || reply.includes("pricing.html")) {
        console.log(`✅ Rate limit triggered at message #${i}`);
        console.log(`   Response: "${reply.substring(0, 80)}..."`);
        hitLimit = true;
        break;
      } else {
        console.log(`[${i}] OK (${response.status})`);
      }
    } catch (error) {
      console.log(`[${i}] Error: ${error.message}`);
      break;
    }

    await new Promise(resolve => setTimeout(resolve, 100));
  }

  if (!hitLimit) {
    console.log(`\n⚠️  Rate limit was NOT triggered after 55 messages. Check enforcement.`);
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

  const response = await askWhatsApp(question, index);
  const validation = validateResponse(question, response);

  printResult(question, response, validation, index + 1, QUESTIONS.length);

  console.log(`\n📄 Full Response:`);
  console.log(`───────────────────────────────`);
  console.log(response.reply || '(empty)');
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
