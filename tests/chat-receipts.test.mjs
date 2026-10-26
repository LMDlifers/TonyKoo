import test from 'node:test';
import assert from 'node:assert/strict';
import { receiptIsCurrent } from '../js/chat-receipts.mjs';

const receipt = (exp) => `${Buffer.from(JSON.stringify({ exp })).toString('base64url')}.signature`;

test('share UI only offers receipts inside their signed creation window', () => {
  assert.equal(receiptIsCurrent(receipt(Date.now() + 60_000)), true);
  assert.equal(receiptIsCurrent(receipt(Date.now() - 1)), false);
  assert.equal(receiptIsCurrent('signed.receipt'), false);
  assert.equal(receiptIsCurrent(''), false);
});
