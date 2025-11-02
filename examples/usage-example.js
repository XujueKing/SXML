/**
 * Example: Using SXML Framework
 * This example demonstrates all core features
 */

const SXML = require('../src/index');

console.log('=== SXML Framework Example ===\n');

// Initialize SXML
const sxml = new SXML({
    secretKey: 'demo-secret-key',
    baseDir: __dirname
});

// Example 1: Template Rendering
console.log('1. Template Rendering:');
const template = `
<div class="greeting">
    <h1>{{greeting}} {{name}}!</h1>
    <p>You have {{count}} messages.</p>
</div>
`.trim();

const html = sxml.render(template, {
    greeting: 'Hello',
    name: 'SXML User',
    count: 5
});

console.log(html);
console.log();

// Example 2: Reactive System
console.log('2. Reactive System:');
const data = sxml.reactive.reactive({
    count: 0,
    name: 'John'
});

console.log('Initial count:', data.count);

// Create effect that runs when data changes
sxml.reactive.effect(() => {
    console.log('Effect triggered! Count is now:', data.count);
});

data.count = 10; // This will trigger the effect
console.log();

// Example 3: Component
console.log('3. Component Example:');
const counter = sxml.component({
    template: '<div>Count: {{count}}</div>',
    data: { count: 0 },
    methods: {
        increment() {
            this.data.count++;
        }
    }
});

console.log('Initial render:', counter.render());
counter.methods.increment();
console.log('After increment:', counter.render());
console.log();

// Example 4: Encryption
console.log('4. Encryption Example:');
const secretData = {
    username: 'admin',
    token: 'secret-token-12345'
};

const encrypted = sxml.encryption.encrypt(secretData);
console.log('Encrypted:', {
    encrypted: encrypted.encrypted.substring(0, 20) + '...',
    iv: encrypted.iv,
    authTag: encrypted.authTag.substring(0, 20) + '...',
    timestamp: encrypted.timestamp
});

const decrypted = sxml.encryption.decrypt(encrypted);
console.log('Decrypted:', decrypted);
console.log();

// Example 5: MD5 Hash
console.log('5. MD5 Hash:');
const hash = sxml.encryption.md5('Hello SXML');
console.log('MD5 of "Hello SXML":', hash);
console.log();

// Example 6: Signature
console.log('6. Digital Signature:');
const requestData = { action: 'getData', id: 123 };
const signature = sxml.encryption.sign(requestData);
console.log('Signature:', signature);

const isValid = sxml.encryption.verify(requestData, signature);
console.log('Signature valid:', isValid);
console.log();

console.log('=== Example Complete ===');
