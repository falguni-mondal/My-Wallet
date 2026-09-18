// ==========================================
// SMS PARSING ENGINE
// ==========================================

export const parseBankSms = (smsBody, sender) => {
  // ------------------------------------------
  // LAYER 1: SENDER WHITELIST
  // ------------------------------------------
  // Official bank alerts in India use 6-character sender IDs (e.g., HDFCBK)
  const allowedSenders = ['HDFCBK', 'ICICIB', 'SBIBNK', 'AXISBK', 'KOTAKB'];
  
  // If the sender doesn't match a known bank, instantly reject it
  const isWhitelisted = allowedSenders.some(bank => sender.toUpperCase().includes(bank));
  if (!isWhitelisted) return null;

  // ------------------------------------------
  // LAYER 2: NEGATIVE KEYWORD GUARD
  // ------------------------------------------
  const lowerBody = smsBody.toLowerCase();
  const spamWords = ['otp', 'loan', 'pre-approved', 'apply', 'reward', 'click', 'discount', 'congratulations'];
  
  // If the text contains promotional/security keywords, reject it
  if (spamWords.some(word => lowerBody.includes(word))) return null;

  // ------------------------------------------
  // LAYER 3: REGEX EXTRACTION
  // ------------------------------------------
  // 1. Find the amount (Matches "Rs. 1500" or "INR 1,500.50")
  const amountRegex = /(?:rs\.?|inr)\s*([\d,]+\.\d{2}|\d+)/i;
  // 2. Determine the flow of money
  const typeRegex = /(debited|credited)/i;
  // 3. Extract the exact account or card ending (Matches "a/c **1234" or "card 1234")
  const accountRegex = /(?:a\/c|acct|account|card)[^\d]*(\d{3,4})/i;

  const amountMatch = smsBody.match(amountRegex);
  const typeMatch = smsBody.match(typeRegex);
  const accountMatch = smsBody.match(accountRegex);

  // If we cannot find an amount OR a transaction type, it is not a valid transaction text
  if (!amountMatch || !typeMatch) return null;

  // Clean the data
  const rawAmount = amountMatch[1].replace(/,/g, ''); // Strip commas for MongoDB
  const type = typeMatch[1].toUpperCase() === 'DEBITED' ? 'EXPENSE' : 'INCOME';
  const accountMask = accountMatch ? accountMatch[1] : null;

  // ------------------------------------------
  // MERCHANT EXTRACTION
  // ------------------------------------------
  let merchant = 'Unknown Merchant';
  // Looks for common merchant prefixes and grabs the text until it hits a space + stopping word
  const merchantRegex = /(?:info|vpa|to|at)\s+([a-zA-Z0-9.\s@*-]+?)(?:\s+ref|\s+avl|\s+on|\.|$)/i;
  const merchantMatch = smsBody.match(merchantRegex);
  if (merchantMatch) {
    merchant = merchantMatch[1].trim();
  }

  // ------------------------------------------
  // IDEMPOTENCY HASH (The Fingerprint)
  // ------------------------------------------
  // We attach a timestamp prefix to ensure a uniquely generated hash for the backend
  const timestampPrefix = Date.now().toString().slice(0, -4); 
  const smsIdentifier = `${sender}_${rawAmount}_${type}_${accountMask || 'nomask'}_${timestampPrefix}`;

  // Return the fully structured payload ready for the Node.js backend
  return {
    amount: parseFloat(rawAmount),
    type,
    merchant,
    accountMask,
    rawSmsBody: smsBody,
    smsIdentifier
  };
};