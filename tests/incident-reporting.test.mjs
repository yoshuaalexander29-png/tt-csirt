import assert from 'node:assert';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

async function runTests() {
  console.log('=== Starting TT-CSIRT Incident Reporting Service Test Suite ===\n');

  // Reset test state
  await fetch(`${BASE_URL}/api/incident-report/test-clear`, { method: 'POST' });

  // 1. Fetch CSRF token
  console.log('Test 1: CSRF Token issuance and security attributes');
  const csrfRes = await fetch(`${BASE_URL}/api/incident-report/csrf`);
  assert.strictEqual(csrfRes.status, 200, 'CSRF endpoint must return 200');
  const cookie = csrfRes.headers.get('set-cookie') || csrfRes.headers.getSetCookie?.()[0];
  assert.ok(cookie && cookie.includes('ttcsirt_csrf'), 'Set-Cookie must include ttcsirt_csrf');
  assert.ok(cookie.includes('HttpOnly'), 'Cookie must be HttpOnly');
  assert.ok(cookie.includes('SameSite=Strict'), 'Cookie must be SameSite=Strict');

  const csrfData = await csrfRes.json();
  assert.ok(csrfData.csrfToken, 'CSRF response must include csrfToken');
  const csrfToken = csrfData.csrfToken;
  console.log('  ✓ CSRF token issued correctly with secure cookie attributes\n');

  // 2. Reject submission without CSRF token
  console.log('Test 2: Submission without CSRF token is rejected with 403');
  const noCsrfRes = await fetch(`${BASE_URL}/api/incident-report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ incidentType: 'Ransomware' })
  });
  assert.strictEqual(noCsrfRes.status, 403, 'Must return 403 without CSRF');
  console.log('  ✓ Missing CSRF token rejected with 403\n');

  // 3. Normal valid submission
  console.log('Test 3: Normal valid submission produces official reference and dispatches email');
  const validPayload = {
    incidentType: "Ransomware",
    incidentTiming: "16 September 2026 at 09:30 AST",
    incidentDetails: "Several virtualization hosts and domain controllers are encrypted. Ransom note from BlackCat affiliate detected at C:\\ransom_note.txt. C2 communication observed to 198.51.100.24 and malicious domain update-service.biz.",
    affectedSystems: "2 Active Directory Domain Controllers, 8 hypervisor nodes, 1 core NAS backup share.",
    impact: "Citizen operational portal offline; corporate authentication inaccessible.",
    evidenceAvailable: "yes",
    evidenceNotes: "Preserved RAM memory dumps and perimeter firewall NetFlow logs.",
    reporterType: "organisation",
    organisation: "National Energy Logistics Ltd.",
    sector: "Energy, Oil & Gas, and Utilities",
    reporterName: "Sean Baptiste",
    email: "s.baptiste@energylogistics.gov.tt",
    phone: "+1 (868) 625-1234",
    website: ""
  };

  const submitRes = await fetch(`${BASE_URL}/api/incident-report`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookie,
      'X-CSRF-Token': csrfToken
    },
    body: JSON.stringify(validPayload)
  });

  assert.strictEqual(submitRes.status, 200, 'Valid submission must return 200');
  const submitData = await submitRes.json();
  assert.strictEqual(submitData.success, true, 'Submission must succeed');
  assert.ok(submitData.reference, 'Must return incident reference');
  assert.match(
    submitData.reference,
    /^TT-CSIRT-IR-\d{4}-\d{6}$/,
    'Reference format must match TT-CSIRT-IR-YYYY-XXXXXX'
  );
  console.log(`  ✓ Generated official reference: ${submitData.reference}`);

  // Verify server-side recorded data & email dispatch
  const lastRes = await fetch(`${BASE_URL}/api/incident-report/test-last`);
  const lastData = await lastRes.json();
  assert.ok(lastData.lastIncident, 'Last incident must be recorded');
  assert.strictEqual(lastData.lastIncident.reference, submitData.reference);
  assert.strictEqual(lastData.lastIncident.incidentType, 'Ransomware');
  assert.strictEqual(lastData.lastIncident.email, 's.baptiste@energylogistics.gov.tt');

  assert.ok(lastData.lastMail, 'Dispatched email record must be present');
  assert.strictEqual(
    lastData.lastMail.recipient,
    'yoshua.alexander@ttcsirt.gov.tt',
    'Recipient must be yoshua.alexander@ttcsirt.gov.tt'
  );
  assert.ok(
    lastData.lastMail.subject.includes(submitData.reference),
    'Subject must contain official reference'
  );
  assert.ok(
    lastData.lastMail.subject.includes('—'),
    'Subject must contain em-dash separator'
  );
  assert.ok(
    lastData.lastMail.html.includes('Arial, Helvetica, sans-serif'),
    'Email HTML must use Arial, Helvetica, sans-serif typography'
  );
  assert.ok(
    lastData.lastMail.text.includes(submitData.reference),
    'Plain text email must include official reference'
  );
  assert.ok(
    lastData.lastMail.text.includes('198.51.100.24'),
    'Technical indicator extraction must capture IP in email'
  );
  assert.ok(
    lastData.lastMail.text.includes('update-service.biz'),
    'Technical indicator extraction must capture domain in email'
  );
  console.log('  ✓ Dispatched email verified: correct recipient, Arial font stack, subject, IoCs, and plain-text alternative\n');

  // 4. Idempotency test (resubmission returns same reference)
  console.log('Test 4: Idempotent resubmission prevents duplicate email');
  const replayRes = await fetch(`${BASE_URL}/api/incident-report`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookie,
      'X-CSRF-Token': csrfToken
    },
    body: JSON.stringify(validPayload)
  });
  assert.strictEqual(replayRes.status, 200);
  const replayData = await replayRes.json();
  assert.strictEqual(replayData.reference, submitData.reference, 'Replay must return exact same reference');
  assert.strictEqual(replayData.idempotentReplay, true, 'Must flag idempotentReplay as true');
  console.log('  ✓ Duplicate rapid submission recognized and deduplicated\n');

  // 5. Honeypot anti-bot test
  console.log('Test 5: Bot honeypot triggers silent discard');
  const botPayload = {
    ...validPayload,
    incidentTiming: "16 September 2026 at 10:00 AST",
    website: "https://spam-trafficker.ru"
  };
  const botRes = await fetch(`${BASE_URL}/api/incident-report`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookie,
      'X-CSRF-Token': csrfToken
    },
    body: JSON.stringify(botPayload)
  });
  assert.strictEqual(botRes.status, 200);
  const botData = await botRes.json();
  assert.ok(botData.reference, 'Bot still receives reference response');

  // Check that the last recorded incident was NOT the bot payload
  const checkBotLast = await fetch(`${BASE_URL}/api/incident-report/test-last`);
  const checkBotData = await checkBotLast.json();
  assert.strictEqual(
    checkBotData.lastIncident.incidentTiming,
    "16 September 2026 at 09:30 AST",
    'Bot payload must not overwrite real incidents or dispatch email'
  );
  console.log('  ✓ Honeypot trap discarded bot submission without dispatching\n');

  // 6. Unknown field rejection
  console.log('Test 6: Unknown fields are rejected with 400');
  const roguePayload = {
    ...validPayload,
    incidentTiming: "16 September 2026 at 11:00 AST",
    maliciousScript: "<script>alert(1)</script>"
  };
  const rogueRes = await fetch(`${BASE_URL}/api/incident-report`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookie,
      'X-CSRF-Token': csrfToken
    },
    body: JSON.stringify(roguePayload)
  });
  assert.strictEqual(rogueRes.status, 400, 'Must reject unrecognized fields with 400');
  console.log('  ✓ Unknown parameter injection rejected\n');

  // 7. CRLF header injection rejection
  console.log('Test 7: CRLF characters in contact fields rejected with 400');
  const crlfPayload = {
    ...validPayload,
    incidentTiming: "16 September 2026 at 11:15 AST",
    email: "user@domain.com\r\nBcc: evil@attacker.com"
  };
  const crlfRes = await fetch(`${BASE_URL}/api/incident-report`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookie,
      'X-CSRF-Token': csrfToken
    },
    body: JSON.stringify(crlfPayload)
  });
  assert.strictEqual(crlfRes.status, 400, 'Must reject CRLF injection with 400');
  console.log('  ✓ CRLF email header injection rejected with 400\n');

  // 8. Missing required fields rejection
  console.log('Test 8: Missing required fields rejected with 400');
  const missingPayload = {
    ...validPayload,
    incidentTiming: "16 September 2026 at 11:30 AST",
    incidentType: ""
  };
  const missingRes = await fetch(`${BASE_URL}/api/incident-report`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookie,
      'X-CSRF-Token': csrfToken
    },
    body: JSON.stringify(missingPayload)
  });
  assert.strictEqual(missingRes.status, 400, 'Must reject missing fields with 400');
  console.log('  ✓ Missing required fields correctly rejected\n');

  // 9. Malformed email rejection
  console.log('Test 9: Malformed email rejected with 400');
  const badEmailPayload = {
    ...validPayload,
    incidentTiming: "16 September 2026 at 11:45 AST",
    email: "not-an-email"
  };
  const badEmailRes = await fetch(`${BASE_URL}/api/incident-report`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookie,
      'X-CSRF-Token': csrfToken
    },
    body: JSON.stringify(badEmailPayload)
  });
  assert.strictEqual(badEmailRes.status, 400, 'Must reject malformed email with 400');
  console.log('  ✓ Malformed email syntax rejected\n');

  // 10. Oversized description rejection
  console.log('Test 10: Oversized description rejected with 400');
  const oversizedPayload = {
    ...validPayload,
    incidentTiming: "16 September 2026 at 12:00 AST",
    incidentDetails: "A".repeat(5001)
  };
  const oversizedRes = await fetch(`${BASE_URL}/api/incident-report`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookie,
      'X-CSRF-Token': csrfToken
    },
    body: JSON.stringify(oversizedPayload)
  });
  assert.strictEqual(oversizedRes.status, 400, 'Must reject oversized description with 400');
  console.log('  ✓ Oversized payload field rejected\n');

  // 11. HTML / script-like input safely escaped
  console.log('Test 11: HTML / script-like input is sanitized and cannot execute in HTML email');
  const xssPayload = {
    ...validPayload,
    incidentTiming: "16 September 2026 at 12:15 AST",
    incidentDetails: "Attack involving <script>alert('pwned')</script> and <img src=x onerror=alert(1)> in web portal payload."
  };
  const xssRes = await fetch(`${BASE_URL}/api/incident-report`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookie,
      'X-CSRF-Token': csrfToken
    },
    body: JSON.stringify(xssPayload)
  });
  assert.strictEqual(xssRes.status, 200);
  const checkXssLast = await fetch(`${BASE_URL}/api/incident-report/test-last`);
  const checkXssData = await checkXssLast.json();
  assert.ok(
    checkXssData.lastMail.html.includes('&lt;script&gt;alert(&#039;pwned&#039;)&lt;/script&gt;'),
    'Script tags must be HTML entity escaped in generated email'
  );
  assert.ok(
    !checkXssData.lastMail.html.includes('<script>'),
    'Raw executable script tags must not exist in HTML email'
  );
  console.log('  ✓ User HTML/script input strictly escaped in email template\n');

  // 12. Concise incident descriptions and explicit uncertainty are accepted
  const concisePayload = {
    ...validPayload,
    incidentTiming: "I don't know yet",
    incidentDetails: "DDoS",
    affectedSystems: "PC",
    impact: "No access",
    evidenceAvailable: "no",
    evidenceNotes: "",
    reporterType: "individual",
    organisation: "",
    sector: ""
  };
  const conciseRes = await fetch(`${BASE_URL}/api/incident-report`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookie,
      'X-CSRF-Token': csrfToken
    },
    body: JSON.stringify(concisePayload)
  });
  assert.strictEqual(conciseRes.status, 200, 'Concise but meaningful narrative answers and explicit uncertainty must be accepted');
  console.log('  ✓ Short narrative and explicit uncertainty answers accepted');

  // 13. The configured maximum is inclusive
  const maximumPayload = {
    ...validPayload,
    incidentTiming: "16 September 2026 at 12:20 AST",
    incidentDetails: "A".repeat(5000)
  };
  const maximumRes = await fetch(`${BASE_URL}/api/incident-report`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookie,
      'X-CSRF-Token': csrfToken
    },
    body: JSON.stringify(maximumPayload)
  });
  assert.strictEqual(maximumRes.status, 200, 'The full 5,000-character maximum must be accepted');
  console.log('  ✓ 5,000-character boundary accepted');

  // 14. Accept common phone separators but reject punctuation-only values
  const dottedPhonePayload = {
    ...validPayload,
    incidentTiming: "16 September 2026 at 12:25 AST",
    phone: "+1.868.625.1234"
  };
  const dottedPhoneRes = await fetch(`${BASE_URL}/api/incident-report`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookie,
      'X-CSRF-Token': csrfToken
    },
    body: JSON.stringify(dottedPhonePayload)
  });
  assert.strictEqual(dottedPhoneRes.status, 200, 'A valid phone number using dot separators must be accepted');
  const punctuationPhoneRes = await fetch(`${BASE_URL}/api/incident-report`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookie,
      'X-CSRF-Token': csrfToken
    },
    body: JSON.stringify({
      ...validPayload,
      incidentTiming: "16 September 2026 at 12:26 AST",
      phone: "()+-. "
    })
  });
  assert.strictEqual(punctuationPhoneRes.status, 400, 'A phone number without enough digits must be rejected');
  console.log('  ✓ Phone validation accepts common separators and rejects values without digits');

  // 15. Mail transport failure handling
  console.log('Test 15: Mail transport failure returns 500 without leaking secrets');
  await fetch(`${BASE_URL}/api/incident-report/test-simulate-failure`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fail: true })
  });

  const failurePayload = {
    ...validPayload,
    incidentTiming: "16 September 2026 at 12:30 AST"
  };
  const failRes = await fetch(`${BASE_URL}/api/incident-report`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookie,
      'X-CSRF-Token': csrfToken
    },
    body: JSON.stringify(failurePayload)
  });
  assert.strictEqual(failRes.status, 500, 'Must return 500 on delivery failure');
  const failData = await failRes.json();
  assert.ok(failData.error, 'Response must include user-facing error message');
  assert.ok(
    failData.error.includes('hotline') || failData.error.includes('TT-CSIRT'),
    'Error message must provide user alternative route'
  );
  assert.ok(
    !failData.error.includes('SMTP') && !failData.error.includes('password'),
    'Error message must not expose server credentials'
  );

  // Restore normal transport
  await fetch(`${BASE_URL}/api/incident-report/test-simulate-failure`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fail: false })
  });
  console.log('  ✓ Transport failure handled gracefully with 500 and user alternative\n');

  // 16. Rate limit enforcement
  console.log('Test 16: Rate limit enforcement under excessive submissions');
  let rateLimited = false;
  for (let i = 0; i < 8; i++) {
    const rapidRes = await fetch(`${BASE_URL}/api/incident-report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookie,
        'X-CSRF-Token': csrfToken
      },
      body: JSON.stringify({
        ...validPayload,
        incidentTiming: `16 September 2026 at rapid-${i}`
      })
    });
    if (rapidRes.status === 429) {
      rateLimited = true;
      break;
    }
  }
  assert.ok(rateLimited, 'Excessive rapid requests must encounter 429');
  console.log('  ✓ Rate limiting successfully enforced with 429\n');

  // Clean up test state after suite completes
  await fetch(`${BASE_URL}/api/incident-report/test-clear`, { method: 'POST' });

  console.log('================================================================');
  console.log('All 16 TT-CSIRT Incident Reporting Service Tests Passed!');
  console.log('================================================================');
}

runTests().catch(err => {
  console.error('Test run failed:', err);
  process.exit(1);
});
