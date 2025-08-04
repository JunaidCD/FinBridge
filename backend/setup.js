const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up FinBridge Backend...\n');

// Check if package.json exists
if (!fs.existsSync('package.json')) {
  console.log('❌ package.json not found. Please run npm init first.');
  process.exit(1);
}

// Create necessary directories if they don't exist
const dirs = ['contracts', 'scripts', 'test', 'artifacts', 'cache'];
dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✅ Created directory: ${dir}`);
  }
});

console.log('\n📋 Backend structure created successfully!');
console.log('\n📦 Next steps:');
console.log('1. Install dependencies: npm install');
console.log('2. Compile contracts: npm run compile');
console.log('3. Run tests: npm test');
console.log('4. Start local node: npm run node');
console.log('5. Deploy contract: npm run deploy');
console.log('\n🔗 After deployment, update the frontend contract address in:');
console.log('   frontend/client/src/contracts/index.js');
console.log('\n✨ Happy coding!'); 