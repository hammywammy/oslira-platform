// =============================================================================
// ADD ES6 EXPORTS TO ALL CORE FILES
// Run: node add-es6-exports.js
// =============================================================================

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Files that need ES6 exports
const filesToFix = [
    { path: 'src/core/infrastructure/EnvDetector.js', className: 'EnvDetector' },
    { path: 'src/core/infrastructure/Logger.js', className: 'Logger' },
    { path: 'src/core/infrastructure/ErrorHandler.js', className: 'ErrorHandler' },
    { path: 'src/core/events/EventBus.js', className: 'EventBus' },
    { path: 'src/core/infrastructure/HttpClient.js', className: 'HttpClient' },
    { path: 'src/core/infrastructure/ConfigProvider.js', className: 'ConfigProvider' },
    { path: 'src/core/infrastructure/Monitoring.js', className: 'Monitoring' },
    { path: 'src/core/state/Store.js', className: 'Store' },
    { path: 'src/core/state/StateManager.js', className: 'StateManager' },
    { path: 'src/core/state/Selectors.js', className: 'Selectors' },
    { path: 'src/core/api/ApiClient.js', className: 'ApiClient' },
    { path: 'src/core/api/endpoints/AnalyticsAPI.js', className: 'AnalyticsAPI' },
    { path: 'src/core/api/endpoints/AuthAPI.js', className: 'AuthAPI' },
    { path: 'src/core/api/endpoints/BusinessAPI.js', className: 'BusinessAPI' },
    { path: 'src/core/api/endpoints/LeadsAPI.js', className: 'LeadsAPI' },
    { path: 'src/core/auth/AuthManager.js', className: 'AuthManager' },
    { path: 'src/core/auth/SessionValidator.js', className: 'SessionValidator' },
    { path: 'src/core/auth/TokenRefresher.js', className: 'TokenRefresher' },
    { path: 'src/core/services/AnalyticsService.js', className: 'AnalyticsService' },
    { path: 'src/core/services/BusinessService.js', className: 'BusinessService' },
    { path: 'src/core/services/UserService.js', className: 'UserService' },
];

console.log('🔧 Starting ES6 export fix...\n');

let fixed = 0;
let skipped = 0;
let errors = 0;

for (const file of filesToFix) {
    const fullPath = path.resolve(__dirname, file.path);
    
    try {
        // Check if file exists
        if (!fs.existsSync(fullPath)) {
            console.log(`⚠️  SKIP: ${file.path} (file not found)`);
            skipped++;
            continue;
        }
        
        // Read file
        let content = fs.readFileSync(fullPath, 'utf8');
        
        // Check if already has export
        if (content.includes(`export default ${file.className}`)) {
            console.log(`✅ SKIP: ${file.path} (already has export)`);
            skipped++;
            continue;
        }
        
        // Add export at the end
        const exportStatement = `\n// =============================================================================\n// ES6 MODULE EXPORT\n// =============================================================================\nexport default ${file.className};\n`;
        
        content += exportStatement;
        
        // Write back
        fs.writeFileSync(fullPath, content, 'utf8');
        
        console.log(`✅ FIXED: ${file.path}`);
        fixed++;
        
    } catch (error) {
        console.error(`❌ ERROR: ${file.path} - ${error.message}`);
        errors++;
    }
}

console.log(`\n═══════════════════════════════════════`);
console.log(`✅ Fixed:   ${fixed}`);
console.log(`⏭️  Skipped: ${skipped}`);
console.log(`❌ Errors:  ${errors}`);
console.log(`═══════════════════════════════════════\n`);

if (errors === 0) {
    console.log('🎉 All files updated successfully!\n');
    console.log('Next steps:');
    console.log('1. Run: npm run dev:vite');
    console.log('2. Test your homepage');
} else {
    console.log('⚠️  Some files had errors. Please review and fix manually.');
}