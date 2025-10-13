// =============================================================================
// DEVCONSOLE - Production Runtime Testing System
// Path: /public/core/dev/DevConsole.js
// =============================================================================

class DevConsole {
    constructor() {
        // Use existing core infrastructure
        this.env = window.OsliraEnv;
        this.eventBus = window.OsliraEventBus;
        this.state = window.OsliraStateManager;
        this.logger = window.OsliraLogger;
        this.errorHandler = window.OsliraErrorHandler;
        
        // Test registry (add more tests here)
        this.testModules = {
            'dashboard': '/core/dev/tests/DashboardTest.js',
            // Add more pages:
            // 'auth': '/core/dev/tests/AuthTest.js',
            // 'marketing': '/core/dev/tests/MarketingTest.js',
        };
        
        this.results = [];
        this.startTime = null;
    }
    
    // =========================================================================
    // MAIN ENTRY POINT
    // =========================================================================
    
    async diagnose() {
        console.clear();
        this.printHeader();
        
        this.startTime = Date.now();
        this.results = [];
        
        // 1. Core infrastructure check
        this.checkCore();
        
        // 2. Page-specific tests (auto-detected)
        await this.runPageTests();
        
        // 3. Results
        this.printResults();
        
        // 4. Auto-fix offer
        this.offerAutoFix();
        
        return this.getSummary();
    }
    
    // =========================================================================
    // CORE INFRASTRUCTURE (Lean - just check if loaded)
    // =========================================================================
    
    checkCore() {
        this.section('🏗️  CORE INFRASTRUCTURE');
        
        // EnvDetector
        if (this.env) {
            this.pass(`EnvDetector: ${this.env.environment} | Page: ${this.env.currentPage}`);
        } else {
            this.fail('EnvDetector missing', 'Check /core/infrastructure/EnvDetector.js');
        }
        
        // EventBus
        if (this.eventBus) {
            const stats = this.eventBus.getStats();
            this.pass(`EventBus: ${stats.eventTypes} types, ${stats.totalListeners} listeners`);
        } else {
            this.fail('EventBus missing', 'Check /core/events/EventBus.js');
        }
        
        // StateManager
        if (this.state) {
            const leads = this.state.getState('leads') || [];
            this.pass(`StateManager: ${leads.length} leads`);
        } else {
            this.fail('StateManager missing', 'Check /core/state/StateManager.js');
        }
        
        // Logger
        this.test('Logger', this.logger, 'Check /core/infrastructure/Logger.js');
        
        // ErrorHandler
        if (this.errorHandler) {
            const stats = this.errorHandler.getStats();
            if (stats.recentErrors > 0) {
                this.warn(`Recent errors: ${stats.recentErrors}`);
            } else {
                this.pass('ErrorHandler: No recent errors');
            }
        } else {
            this.fail('ErrorHandler missing', 'Check /core/infrastructure/ErrorHandler.js');
        }
        
        // Auth
        if (window.OsliraAuth) {
            if (window.OsliraAuth.user) {
                this.pass(`Auth: ${window.OsliraAuth.user.email}`);
            } else {
                this.warn('Auth: No active session');
            }
        } else {
            this.fail('AuthManager missing', 'Check /core/auth/AuthManager.js');
        }
        
        // ApiClient (critical check)
        this.checkApiClient();
    }
    
    checkApiClient() {
        if (!window.OsliraApiClient) {
            this.fail('ApiClient missing', 'Check /core/api/ApiClient.js exports');
            return;
        }
        
        // Check if it's a class (common mistake)
        if (typeof window.OsliraApiClient === 'function') {
            this.fail('ApiClient is CLASS (should be instance)', 
                     'Fix: Change ApiClient.js line: window.OsliraApiClient = new ApiClient()');
            return;
        }
        
        // Check if initialized
        if (!window.OsliraApiClient.isInitialized) {
            this.fail('ApiClient not initialized',
                     'Fix: Run await window.OsliraApiClient.initialize({ httpClient, logger, authManager })');
            return;
        }
        
        // Check dependencies
        if (!window.OsliraApiClient.httpClient) {
            this.fail('ApiClient missing HttpClient dependency',
                     'Fix: Pass httpClient in initialize()');
            return;
        }
        
        this.pass('ApiClient: Initialized and ready');
    }
    
    // =========================================================================
    // PAGE-SPECIFIC TESTS
    // =========================================================================
    
    async runPageTests() {
        const currentPage = this.env?.currentPage;
        
        if (!currentPage) {
            this.warn('Cannot detect current page');
            return;
        }
        
        // Check if test module exists for this page
        const testPath = this.testModules[currentPage];
        
        if (!testPath) {
            this.info(`No tests defined for "${currentPage}" page`);
            return;
        }
        
        // Check if test class is loaded
        const testClassName = this.getTestClassName(currentPage);
        
        if (!window[testClassName]) {
            this.warn(`${testClassName} not loaded (expected from ${testPath})`);
            return;
        }
        
        // Run the test
        this.section(`📄 ${currentPage.toUpperCase()} PAGE`);
        
        try {
            const TestClass = window[testClassName];
            const test = new TestClass();
            const results = await test.run();
            
            // Add results to our results array
            results.forEach(r => {
                if (r.status === 'PASS') {
                    this.pass(r.message);
                } else if (r.status === 'WARN') {
                    this.warn(r.message);
                } else {
                    this.fail(r.message, r.fix);
                }
            });
        } catch (error) {
            this.fail(`Test execution failed: ${error.message}`, 'Check test file for errors');
        }
    }
    
    getTestClassName(pageName) {
        // Convert page name to test class name
        // dashboard → DashboardTest
        // auth → AuthTest
        return pageName.charAt(0).toUpperCase() + pageName.slice(1) + 'Test';
    }
    
    // =========================================================================
    // TEST RESULT METHODS
    // =========================================================================
    
    test(name, condition, fix) {
        if (condition) {
            this.pass(`${name} loaded`);
        } else {
            this.fail(`${name} missing`, fix);
        }
    }
    
    pass(message) {
        this.results.push({ status: 'PASS', message });
        console.log(`%c  ✅ ${message}`, 'color: #10b981');
    }
    
    fail(message, fix) {
        this.results.push({ status: 'FAIL', message, fix });
        console.log(`%c  ❌ ${message}`, 'color: #ef4444; font-weight: 500');
        if (fix) {
            console.log(`%c     💡 ${fix}`, 'color: #f59e0b; font-style: italic');
        }
    }
    
    warn(message) {
        this.results.push({ status: 'WARN', message });
        console.log(`%c  ⚠️  ${message}`, 'color: #f59e0b');
    }
    
    info(message) {
        console.log(`%c  ℹ️  ${message}`, 'color: #6b7280');
    }
    
    // =========================================================================
    // FORMATTING
    // =========================================================================
    
    printHeader() {
        console.log('%c┌─────────────────────────────────────────┐', 'color: #3b82f6; font-weight: bold; font-size: 12px');
        console.log('%c│                                         │', 'color: #3b82f6; font-weight: bold; font-size: 12px');
        console.log('%c│     OSLIRA DEVCONSOLE DIAGNOSTICS      │', 'color: #3b82f6; font-weight: bold; font-size: 12px');
        console.log('%c│                                         │', 'color: #3b82f6; font-weight: bold; font-size: 12px');
        console.log('%c└─────────────────────────────────────────┘', 'color: #3b82f6; font-weight: bold; font-size: 12px');
        console.log('');
    }
    
    section(title) {
        console.log(`\n%c${title}`, 'color: #8b5cf6; font-weight: bold; font-size: 13px');
        console.log('%c' + '─'.repeat(42), 'color: #8b5cf6');
    }
    
    printResults() {
        const duration = Date.now() - this.startTime;
        const passed = this.results.filter(r => r.status === 'PASS').length;
        const failed = this.results.filter(r => r.status === 'FAIL').length;
        const warnings = this.results.filter(r => r.status === 'WARN').length;
        const total = passed + failed;
        const percentage = total > 0 ? ((passed / total) * 100).toFixed(0) : 0;
        
        console.log('\n%c┌─────────────────────────────────────────┐', 'color: #3b82f6; font-weight: bold');
        console.log(`%c│  SUMMARY: ${passed}/${total} PASSED (${percentage}%) - ${duration}ms  │`, 'color: #3b82f6; font-weight: bold');
        console.log('%c└─────────────────────────────────────────┘', 'color: #3b82f6; font-weight: bold');
        
        if (failed === 0 && warnings === 0) {
            console.log('%c\n  🎉 All tests passed! System is healthy.\n', 'color: #10b981; font-size: 14px; font-weight: bold');
        } else if (failed === 0) {
            console.log(`%c\n  ⚡ ${warnings} warning(s) detected.\n`, 'color: #f59e0b; font-size: 14px');
        } else {
            console.log(`%c\n  🔧 ${failed} issue(s) detected, ${warnings} warning(s).\n`, 'color: #ef4444; font-size: 14px; font-weight: bold');
        }
    }
    
    offerAutoFix() {
        const fixable = this.results.filter(r => 
            r.status === 'FAIL' && 
            r.fix && 
            r.fix.startsWith('Fix: Run ')
        );
        
        if (fixable.length > 0) {
            console.log('%c  💊 Auto-fixable issues detected!', 'color: #8b5cf6; font-weight: bold');
            console.log('%c     Run: fix()', 'color: #8b5cf6; font-style: italic');
            console.log('');
        }
    }
    
    // =========================================================================
    // AUTO-FIX SYSTEM
    // =========================================================================
    
    async fix() {
        console.log('\n%c🔧 Applying auto-fixes...', 'color: #8b5cf6; font-weight: bold; font-size: 14px');
        console.log('');
        
        let fixCount = 0;
        
        // Fix: ApiClient not initialized
        if (window.OsliraApiClient && !window.OsliraApiClient.isInitialized) {
            try {
                console.log('  ⚙️  Initializing ApiClient...');
                await window.OsliraApiClient.initialize({
                    httpClient: window.OsliraHttpClient,
                    logger: window.OsliraLogger,
                    authManager: window.OsliraAuth
                });
                console.log('%c  ✅ ApiClient initialized', 'color: #10b981');
                fixCount++;
            } catch (error) {
                console.log(`%c  ❌ Failed: ${error.message}`, 'color: #ef4444');
            }
        }
        
        if (fixCount === 0) {
            console.log('%c  ℹ️  No auto-fixable issues found', 'color: #6b7280');
        } else {
            console.log(`\n%c  ✨ Applied ${fixCount} fix(es)`, 'color: #10b981; font-weight: bold');
            console.log('%c     Re-run diagnose() to verify', 'color: #6b7280; font-style: italic');
        }
        
        console.log('');
    }
    
    // =========================================================================
    // SUMMARY
    // =========================================================================
    
    getSummary() {
        const passed = this.results.filter(r => r.status === 'PASS').length;
        const failed = this.results.filter(r => r.status === 'FAIL').length;
        const warnings = this.results.filter(r => r.status === 'WARN').length;
        
        return {
            healthy: failed === 0,
            passed,
            failed,
            warnings,
            total: passed + failed,
            duration: Date.now() - this.startTime,
            results: this.results,
            environment: this.env?.environment,
            page: this.env?.currentPage
        };
    }
}


