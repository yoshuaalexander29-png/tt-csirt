#!/usr/bin/env node

/**
 * TT-CSIRT Incident Email Test Harness (Developer CLI Tool)
 * 
 * Tests the real application -> SMTP server -> recipient delivery path
 * using the production email generation logic and real Nodemailer SMTP transport.
 * 
 * Usage:
 *   npm run test:incident-email
 *   node scripts/test-incident-email.mjs
 */

import nodemailer from 'nodemailer';
import {
  generateIncidentReference,
  extractTechnicalIndicators,
  generateHtmlEmail,
  generatePlainTextEmail,
  sanitizeHeader
} from '../server/incidentReportingServer.js';

async function runEmailHarness() {
  const smtpHost = process.env.SMTP_HOST?.trim() || '192.168.70.3';
  const smtpPort = parseInt(process.env.SMTP_PORT || '25', 10);
  const smtpSecure = process.env.SMTP_SECURE === 'true' || smtpPort === 465;
  const smtpUser = process.env.SMTP_USER?.trim() || '';
  const smtpPass = process.env.SMTP_PASSWORD || '';
  const recipient = process.env.INCIDENT_REPORT_RECIPIENT?.trim() || 'yoshua.alexander@ttcsirt.gov.tt';
  const from = process.env.INCIDENT_REPORT_FROM?.trim() || 'yoshua.alexander@ttcsirt.gov.tt';

  console.log('Incident email test');
  console.log('-------------------');
  console.log(`Recipient: ${recipient}`);
  console.log(`SMTP host: ${smtpHost}`);
  console.log(`SMTP port: ${smtpPort}`);
  console.log(`Transport: SMTP`);
  console.log('');

  // 1. Synthetic test fixture - no real citizen information
  const reference = generateIncidentReference();
  const syntheticIncident = {
    incidentType: 'Ransomware',
    incidentTiming: '16 September 2026 at 14:00 AST',
    description: 'Synthetic TT-CSIRT email delivery test. No real incident.',
    affectedSystems: 'TEST-SYSTEM-01',
    impact: 'No real-world impact. Synthetic test data only.',
    evidenceAvailable: 'No',
    evidenceNotes: 'Synthetic test. No evidence attached.',
    reporterType: 'organisation',
    organisation: 'TT-CSIRT TEST ENVIRONMENT',
    sector: 'Government / Public Sector',
    fullName: 'Automated Email Delivery Test',
    email: recipient,
    telephone: '000-0000',
    website: '',
    actionsTaken: 'Synthetic test only.',
    additionalComments: 'THIS IS A SYNTHETIC EMAIL DELIVERY TEST — NOT A CYBER INCIDENT.',
    reference,
    ipAddress: '127.0.0.1'
  };

  // 2. Extract observable IoCs using shared production routine
  const indicators = extractTechnicalIndicators(
    syntheticIncident.description,
    syntheticIncident.affectedSystems,
    syntheticIncident.actionsTaken,
    syntheticIncident.additionalComments
  );

  // 3. Generate HTML & plain-text representations using shared production templates
  const formattedDate = new Date().toUTCString();
  const htmlBody = generateHtmlEmail(syntheticIncident, indicators, formattedDate);
  const textBody = generatePlainTextEmail(syntheticIncident, indicators, formattedDate);

  // 4. Configure real SMTP transport with bounded timeouts
  const transportConfig = {
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 10000,
    tls: {
      rejectUnauthorized: true,
      minVersion: 'TLSv1.2'
    }
  };

  if (smtpUser) {
    transportConfig.auth = {
      user: smtpUser,
      pass: smtpPass
    };
  }

  const transporter = nodemailer.createTransport(transportConfig);

  // Stage 1: Handshake & Connection verification
  try {
    await transporter.verify();
    console.log('Connection: SUCCESS');
    if (smtpUser) {
      console.log('Authentication: SUCCESS');
    } else {
      console.log('Authentication: SKIPPED (Unauthenticated SMTP relay)');
    }
  } catch (verifyErr) {
    console.log('Result: SMTP CONNECTION FAILED');
    console.log('Stage: connection');
    
    let reason = verifyErr.message || 'unknown error';
    if (verifyErr.code === 'ETIMEDOUT' || verifyErr.message.includes('timeout')) {
      reason = 'connection timeout';
    } else if (verifyErr.code === 'ECONNREFUSED') {
      reason = 'connection refused';
    } else if (verifyErr.code === 'EHOSTUNREACH' || verifyErr.code === 'ENETUNREACH') {
      reason = 'host unreachable';
    } else if (verifyErr.responseCode === 535 || verifyErr.message.includes('auth') || verifyErr.message.includes('Username and Password not accepted')) {
      console.log('Result: SMTP AUTHENTICATION FAILED');
      console.log('Stage: authentication');
      reason = 'credentials rejected by mail server';
    }
    console.log(`Reason: ${reason}`);
    process.exit(1);
  }

  // Stage 2: Attempt real message transmission
  const subject = `[TT-CSIRT Incident Report] ${reference} — ${syntheticIncident.incidentType}`;
  const mailOptions = {
    from,
    to: recipient,
    replyTo: sanitizeHeader(syntheticIncident.email),
    subject,
    text: textBody,
    html: htmlBody,
    headers: {
      'X-Priority': '1',
      'X-TTCSIRT-Reference': reference,
      'X-TTCSIRT-Test': 'synthetic-delivery-test',
      'X-TTCSIRT-Incident-Type': syntheticIncident.incidentType
    }
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    const acceptedCount = Array.isArray(info.accepted) ? info.accepted.length : (info.accepted ? 1 : 0);
    const rejectedCount = Array.isArray(info.rejected) ? info.rejected.length : 0;

    if (acceptedCount > 0 && rejectedCount === 0) {
      console.log('Recipient accepted: SUCCESS');
    } else if (rejectedCount > 0) {
      console.log(`Recipient accepted: PARTIAL (${acceptedCount} accepted, ${rejectedCount} rejected)`);
    } else {
      console.log('Recipient accepted: FAILED');
    }

    if (info.messageId) {
      console.log(`Message ID: ${info.messageId}`);
    }
    if (info.response) {
      console.log(`Server Response: ${info.response}`);
    }

    console.log('');
    console.log('Result: SMTP SERVER ACCEPTED MESSAGE');
    process.exit(0);
  } catch (sendErr) {
    console.log('');
    console.log('Result: SMTP DELIVERY FAILED');
    console.log('Stage: transmission');
    console.log(`Reason: ${sendErr.message}`);
    process.exit(1);
  }
}

runEmailHarness().catch(err => {
  console.error('Test harness exception:', err.message);
  process.exit(1);
});
