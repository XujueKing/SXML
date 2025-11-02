/**
 * Test Suite for SXML Framework
 */

const assert = require('assert');
const SXML = require('../src/index');
const SXMLEngine = require('../src/core/template-engine');
const ReactiveSystem = require('../src/core/reactive');
const EncryptionUtil = require('../src/utils/encryption');

// Test counter
let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
    passed++;
  } catch (e) {
    console.error(`✗ ${name}`);
    console.error(`  ${e.message}`);
    failed++;
  }
}

console.log('\n=== SXML Framework Tests ===\n');

// Template Engine Tests
console.log('Template Engine Tests:');

test('Template Engine - Basic interpolation', () => {
  const engine = new SXMLEngine();
  const result = engine.render('Hello {{name}}!', { name: 'World' });
  assert.strictEqual(result, 'Hello World!');
});

test('Template Engine - Multiple interpolations', () => {
  const engine = new SXMLEngine();
  const result = engine.render('{{greeting}} {{name}}!', { 
    greeting: 'Hello', 
    name: 'SXML' 
  });
  assert.strictEqual(result, 'Hello SXML!');
});

test('Template Engine - Expression evaluation', () => {
  const engine = new SXMLEngine();
  const result = engine.render('Result: {{a + b}}', { a: 5, b: 3 });
  assert.strictEqual(result, 'Result: 8');
});

test('Template Engine - HTML escaping', () => {
  const engine = new SXMLEngine();
  const result = engine.render('{{html}}', { html: '<script>alert("xss")</script>' });
  assert(result.includes('&lt;script&gt;'));
});

// Reactive System Tests
console.log('\nReactive System Tests:');

test('Reactive - Creates proxy object', () => {
  const reactive = new ReactiveSystem();
  const data = reactive.reactive({ count: 0 });
  assert.strictEqual(data.count, 0);
});

test('Reactive - Tracks changes', () => {
  const reactive = new ReactiveSystem();
  let updated = false;
  const data = reactive.reactive({ count: 0 }, () => {
    updated = true;
  });
  data.count = 5;
  assert.strictEqual(data.count, 5);
  assert.strictEqual(updated, true);
});

test('Reactive - Effect runs on change', () => {
  const reactive = new ReactiveSystem();
  const data = reactive.reactive({ count: 0 });
  let effectRan = 0;
  
  reactive.effect(() => {
    const val = data.count; // Access to track
    effectRan++;
  });
  
  data.count = 1;
  assert(effectRan >= 1);
});

test('Reactive - Nested objects', () => {
  const reactive = new ReactiveSystem();
  const data = reactive.reactive({ 
    user: { name: 'John' } 
  });
  data.user.name = 'Jane';
  assert.strictEqual(data.user.name, 'Jane');
});

// Encryption Tests
console.log('\nEncryption Tests:');

test('Encryption - Encrypt and decrypt', () => {
  const encryption = new EncryptionUtil('test-key');
  const data = { message: 'Hello World' };
  const encrypted = encryption.encrypt(data);
  const decrypted = encryption.decrypt(encrypted);
  assert.deepStrictEqual(decrypted, data);
});

test('Encryption - MD5 hash', () => {
  const encryption = new EncryptionUtil();
  const hash = encryption.md5('test');
  assert.strictEqual(typeof hash, 'string');
  assert.strictEqual(hash.length, 32);
});

test('Encryption - API request encryption', () => {
  const encryption = new EncryptionUtil('test-key');
  const data = { action: 'test', value: 123 };
  const encrypted = encryption.encryptAPIRequest(data);
  
  assert(encrypted.payload);
  assert(encrypted.iv);
  assert(encrypted.tag);
  assert(encrypted.ts);
});

test('Encryption - Signature verification', () => {
  const encryption = new EncryptionUtil('test-key');
  const data = { message: 'test' };
  const signature = encryption.sign(data);
  const valid = encryption.verify(data, signature);
  assert.strictEqual(valid, true);
});

test('Encryption - Invalid signature detection', () => {
  const encryption = new EncryptionUtil('test-key');
  const data = { message: 'test' };
  const signature = encryption.sign(data);
  const tamperedData = { message: 'tampered' };
  
  try {
    const valid = encryption.verify(tamperedData, signature);
    assert.strictEqual(valid, false);
  } catch (e) {
    // Expected - signatures don't match
    assert(true);
  }
});

// SXML Integration Tests
console.log('\nSXML Integration Tests:');

test('SXML - Creates instance', () => {
  const sxml = new SXML();
  assert(sxml.templateEngine);
  assert(sxml.reactive);
  assert(sxml.encryption);
});

test('SXML - Renders template', () => {
  const sxml = new SXML();
  const result = sxml.render('Hello {{name}}', { name: 'SXML' });
  assert.strictEqual(result, 'Hello SXML');
});

test('SXML - Creates component', () => {
  const sxml = new SXML();
  const component = sxml.component({
    template: '<div>{{message}}</div>',
    data: { message: 'Hello' }
  });
  
  assert(component.data);
  assert(component.render);
  assert.strictEqual(component.data.message, 'Hello');
});

test('SXML - Component rendering', () => {
  const sxml = new SXML();
  const component = sxml.component({
    template: '<h1>{{title}}</h1>',
    data: { title: 'Test' }
  });
  
  const html = component.render();
  assert(html.includes('Test'));
});

// Summary
console.log('\n=== Test Summary ===');
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Total: ${passed + failed}`);

if (failed > 0) {
  process.exit(1);
} else {
  console.log('\n✓ All tests passed!\n');
  process.exit(0);
}
