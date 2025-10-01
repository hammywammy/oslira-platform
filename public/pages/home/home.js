// =============================================================================
// HOME.JS - CLEAN UI AND EVENT MANAGEMENT
// =============================================================================

console.log('🏠 [Home] Home.js script loading...');

// Global state - single declaration
let isInitialized = false;
let footerInitialized = false;
let conversionTrackingEnabled = true;

// Conversion tracking state
const conversionState = {
  demoUsed: false,
  ctaClicked: false,
  socialProofShown: false,
  timeOnPage: 0,
  scrollDepth: 0
};

// EMERGENCY: Execute immediately since DOM is already loaded
async function initializeHomePage() {
  console.log("🚀🚀🚀 EMERGENCY: Initializing home page IMMEDIATELY");
  
  // Prevent auto-redirect by blocking simple-app initialization
  window.preventSimpleAppInit = true;
  
  await initializeApp();
  setupEventListeners();
  setupAnimations();
  initializeConversionOptimizations();
  
  // CRITICAL: Call setupInstagramDemo directly
  console.log('🔥🔥🔥 [Home] EMERGENCY calling setupInstagramDemo...');
  setupInstagramDemo();
  
  // Force footer initialization after scripts load
  setTimeout(async () => {
    if (window.FooterManager && !document.querySelector('.footer-main')) {
      console.log('🦶 [Home] Force-initializing footer...');
      const footerManager = new window.FooterManager();
      footerManager.render('footer-container');
    }
  }, 3000);
}

// Execute immediately if DOM ready, otherwise wait
if (document.readyState === 'loading') {
  console.log('🕐 [Home] DOM still loading - adding DOMContentLoaded listener');
  document.addEventListener("DOMContentLoaded", initializeHomePage);
} else {
  console.log('🚀 [Home] DOM already loaded - executing immediately');
  initializeHomePage();
}

// Listen for scripts loaded event to initialize footer - ONCE ONLY
window.addEventListener('oslira:scripts:loaded', async () => {
  if (footerInitialized) {
    console.log('🔄 [Home] Footer already initialized, skipping...');
    return;
  }
  
  console.log('🚀 [Home] Scripts loaded event received, initializing footer...');
  try {
    footerInitialized = true;
    await initializeFooter();
  } catch (error) {
    console.error('❌ [Home] Footer initialization failed:', error);
    footerInitialized = false; // Reset on error
  }
});

// =============================================================================
// CONVERSION OPTIMIZATION FEATURES
// =============================================================================

function initializeConversionOptimizations() {
  console.log('🎯 [Home] Initializing conversion optimizations...');
  
  // Setup CTA tracking and optimization
  setupCTAOptimizations();
  
  // Initialize social proof popups
  setupSocialProofNotifications();
  
  // Setup scroll tracking for conversion analytics
  setupScrollTracking();
  
  // Initialize urgency elements
  setupUrgencyElements();
  
  // Setup sticky mobile CTA
  setupMobileStickyCA();
  
  // Initialize time-based triggers
  setupTimeTriggers();
  
  console.log('✅ [Home] Conversion optimizations ready');
}

// Show urgency banner after page loads - OUTSIDE the function
setTimeout(() => {
  const urgencyBanner = document.querySelector('.urgency-banner');
  if (urgencyBanner) {
    urgencyBanner.classList.add('show');
  }
}, 500);
// =============================================================================
// INSTAGRAM DEMO FUNCTIONALITY - UI SETUP ONLY
// =============================================================================

function setupInstagramDemo() {
  console.log('🔥🔥🔥 [Home] EMERGENCY setupInstagramDemo called!');
  console.log('🔥🔥🔥 [Home] DOM Ready State:', document.readyState);
  console.log('🔥🔥🔥 [Home] window.HomeHandlers exists:', !!window.HomeHandlers);
  
  const demoInput = document.getElementById('demo-handle-input');
  const demoBtn = document.getElementById('demo-analyze-btn');
  const demoResults = document.getElementById('demo-results');
  
  console.log('🔥🔥🔥 [Home] EMERGENCY Demo elements check:', {
    input: !!demoInput,
    inputElement: demoInput,
    button: !!demoBtn,
    buttonElement: demoBtn,
    results: !!demoResults,
    resultsElement: demoResults
  });
  
  if (!demoInput || !demoBtn || !demoResults) {
    console.error('🚨🚨🚨 [Home] EMERGENCY - Demo elements not found!');
    console.error('🚨🚨🚨 [Home] HTML Structure Check:', document.body.innerHTML.includes('demo-handle-input'));
    return;
  }
  
  console.log('🔥🔥🔥 [Home] EMERGENCY Setting up Instagram demo UI...');
  
  // Demo button click handler - delegates to homeHandlers.js
  demoBtn.addEventListener('click', async (event) => {
    console.log('🔥🔥🔥🔥🔥 [Home] EMERGENCY BUTTON CLICKED!!!');
    console.log('🔥🔥🔥 [Home] Click Event:', event);
    console.log('🔥🔥🔥 [Home] Button Element:', event.target);
    
    const handle = demoInput.value.trim();
    console.log('🔥🔥🔥 [Home] Handle entered:', handle);
    console.log('🔥🔥🔥 [Home] Handle length:', handle.length);
    console.log('🔥🔥🔥 [Home] Raw input value:', demoInput.value);
    
    if (!handle) {
      console.log('🚨🚨🚨 [Home] EMERGENCY - No handle entered!');
      
      // RED SHAKE ANIMATION + ERROR MESSAGE
      demoInput.style.borderColor = '#ef4444';
      demoInput.style.backgroundColor = '#fee2e2';
      demoInput.classList.add('animate-wiggle');
      demoInput.placeholder = 'Enter a username!';
      
      // Create error message
      let errorMsg = document.getElementById('demo-error-msg');
      if (!errorMsg) {
        errorMsg = document.createElement('div');
        errorMsg.id = 'demo-error-msg';
        errorMsg.style.cssText = 'color: #ef4444; font-size: 0.875rem; margin-top: 0.5rem; font-weight: 600;';
        demoInput.parentNode.appendChild(errorMsg);
      }
      errorMsg.textContent = '⚠️ Please enter a username to analyze!';
      
      // Focus and shake
      demoInput.focus();
      setTimeout(() => {
        demoInput.classList.remove('animate-wiggle');
        demoInput.style.borderColor = '';
        demoInput.style.backgroundColor = '';
        if (errorMsg) errorMsg.remove();
      }, 3000);
      return;
    }
    
    console.log('🔥🔥🔥 [Home] EMERGENCY Delegating to HomeHandlers...');
 console.log('🔥🔥🔥 [Home] window.HomeHandlers check:', {
  exists: !!window.HomeHandlers,
  type: typeof window.HomeHandlers,
  hasRunMethod: !!(window.HomeHandlers && window.HomeHandlers.runInstagramAnalysis),
  allMethods: (window.HomeHandlers && typeof window.HomeHandlers === 'object') 
    ? Object.keys(window.HomeHandlers) 
    : 'NOT_AVAILABLE'
});
    
    // Delegate to handlers in homeHandlers.js
    if (window.HomeHandlers && window.HomeHandlers.runInstagramAnalysis) {
      console.log('🔥🔥🔥 [Home] CALLING runInstagramAnalysis...');
      await window.HomeHandlers.runInstagramAnalysis(handle);
    } else {
      console.error('🚨🚨🚨 [Home] EMERGENCY - HomeHandlers not available!');
      console.error('🚨🚨🚨 [Home] Window object keys:', Object.keys(window));
      
      // FORCE SHOW SOMETHING
      alert(`EMERGENCY MODE: Analyzing @${handle}... (HomeHandlers not loaded)`);
      
      // Wait and retry
      setTimeout(() => {
        console.log('🔄🔄🔄 [Home] RETRY after 1 second...');
        if (window.HomeHandlers && window.HomeHandlers.runInstagramAnalysis) {
          console.log('🔄🔄🔄 [Home] RETRY SUCCESS - calling runInstagramAnalysis');
          window.HomeHandlers.runInstagramAnalysis(handle);
        } else {
          console.error('🚨🚨🚨 [Home] RETRY FAILED - still no HomeHandlers');
          alert('Demo temporarily unavailable. Please refresh the page.');
        }
      }, 1000);
    }
  });
  
  console.log('🔥🔥🔥 [Home] EMERGENCY Event listener added to button!');
  
  // Enter key support
  demoInput.addEventListener('keypress', (e) => {
    console.log('🔥🔥🔥 [Home] Key pressed:', e.key);
    if (e.key === 'Enter') {
      console.log('🔥🔥🔥 [Home] Enter key - triggering click!');
      demoBtn.click();
    }
  });
  
  // Auto-clean input
  demoInput.addEventListener('input', (e) => {
    console.log('🔥🔥🔥 [Home] Input changed:', e.target.value);
    let value = e.target.value;
    if (value.length > 0 && !value.startsWith('@')) {
      value = '@' + value.replace('@', '');
    }
    e.target.value = value;
    console.log('🔥🔥🔥 [Home] Input cleaned to:', value);
  });
  
  console.log('🔥🔥🔥 [Home] EMERGENCY Setup complete!');
}

// =============================================================================
// CTA OPTIMIZATION & TRACKING
// =============================================================================

function setupCTAOptimizations() {
  console.log('🎯 [Home] Setting up CTA optimizations...');
  
  // Track all CTA clicks
  const ctaButtons = document.querySelectorAll('[class*="btn-primary"], [class*="cta"]');
  
  // Setup hover effects for additional dopamine
  ctaButtons.forEach(button => {
    button.addEventListener('mouseenter', () => {
      trackConversionEvent('cta_hover', { 
        type: identifyCTAType(button) 
      });
    });
  });
}

function identifyCTAType(button) {
  const classList = button.className;
  if (classList.includes('primary-cta-main')) return 'hero_main';
  if (classList.includes('final-cta-main')) return 'final_main';
  if (classList.includes('mobile-cta-btn')) return 'mobile_sticky';
  if (classList.includes('sticky-cta')) return 'nav_sticky';
  if (classList.includes('btn-primary-modal')) return 'demo_modal';
  return 'secondary';
}

function getCTAPosition(button) {
  const rect = button.getBoundingClientRect();
  return {
    x: Math.round(rect.left),
    y: Math.round(rect.top),
    visible: rect.top >= 0 && rect.top <= window.innerHeight
  };
}

// =============================================================================
// SOCIAL PROOF NOTIFICATIONS
// =============================================================================

function setupSocialProofNotifications() {
  console.log('📢 [Home] Setting up social proof notifications...');
  
  const notifications = [
    { avatar: 'SC', text: 'Sarah C. just got 5 new leads using Oslira!' },
    { avatar: 'MR', text: '1,247 copywriters accelerating their outreach' },
    { avatar: 'AJ', text: 'Alex J. booked 3 clients this week' },
    { avatar: 'TK', text: 'Someone just improved their response rate by 31%' },
    { avatar: 'JD', text: 'Jordan D. saved 6 hours of prospecting yesterday' }
  ];
  
  let notificationIndex = 0;
  let notificationTimer;
  
  function showSocialProofNotification() {
    if (conversionState.socialProofShown) return;
    
    const container = document.getElementById('social-proof-notifications');
    if (!container) return;
    
    const notification = notifications[notificationIndex];
    const notificationEl = createNotificationElement(notification);
    
    container.appendChild(notificationEl);
    
    // Animate in
    setTimeout(() => {
      notificationEl.classList.add('show');
    }, 100);
    
    // Auto dismiss after 4 seconds
    setTimeout(() => {
      notificationEl.classList.remove('show');
      setTimeout(() => {
        if (notificationEl.parentNode) {
          notificationEl.parentNode.removeChild(notificationEl);
        }
      }, 300);
    }, 4000);
    
    trackConversionEvent('social_proof_shown', { 
      notification: notification.text,
      index: notificationIndex 
    });
    
    notificationIndex = (notificationIndex + 1) % notifications.length;
  }
  
  function createNotificationElement(notification) {
    const div = document.createElement('div');
    div.className = 'notification-popup';
    div.innerHTML = `
      <div class="notification-content">
        <div class="notification-avatar">${notification.avatar}</div>
        <div class="notification-text">${notification.text}</div>
      </div>
    `;
    
    // Click to dismiss
    div.addEventListener('click', () => {
      div.classList.remove('show');
      trackConversionEvent('social_proof_clicked');
    });
    
    return div;
  }
  
  // Start showing notifications after user has been on page for 10 seconds
  setTimeout(() => {
    if (!conversionState.ctaClicked) {
      showSocialProofNotification();
      conversionState.socialProofShown = true;
      
      // Show more notifications every 15 seconds
      notificationTimer = setInterval(() => {
        if (!conversionState.ctaClicked && Math.random() > 0.5) {
          showSocialProofNotification();
        }
      }, 15000);
    }
  }, 10000);
}

// =============================================================================
// SCROLL TRACKING & ANALYTICS
// =============================================================================

function setupScrollTracking() {
  let maxScrollDepth = 0;
  let scrollMilestones = [25, 50, 75, 90, 100];
  let milestonesHit = new Set();
  
  function trackScroll() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = Math.round((scrollTop / docHeight) * 100);
    
    if (scrollPercent > maxScrollDepth) {
      maxScrollDepth = scrollPercent;
      conversionState.scrollDepth = scrollPercent;
    }
    
    // Track milestone achievements
    scrollMilestones.forEach(milestone => {
      if (scrollPercent >= milestone && !milestonesHit.has(milestone)) {
        milestonesHit.add(milestone);
        trackConversionEvent('scroll_milestone', { 
          milestone: milestone,
          timeOnPage: conversionState.timeOnPage 
        });
      }
    });
  }
  
  let scrollTimeout;
  window.addEventListener('scroll', () => {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(trackScroll, 100);
  });
}

// =============================================================================
// URGENCY ELEMENTS
// =============================================================================

function setupUrgencyElements() {
  console.log('⏰ [Home] Setting up urgency elements...');
  
  // Urgency banner close functionality
  const urgencyClose = document.querySelector('.urgency-close');
  if (urgencyClose) {
    urgencyClose.addEventListener('click', () => {
      const banner = urgencyClose.closest('.urgency-banner');
      if (banner) {
        banner.style.display = 'none';
        trackConversionEvent('urgency_banner_closed');
      }
    });
  }
  
  // Update countdown numbers dynamically
  updateUrgencyCounters();
  
  // Update counters every hour
  setInterval(updateUrgencyCounters, 3600000);
}

function updateUrgencyCounters() {
  // Simulate decreasing availability
  const spots = Math.floor(Math.random() * 50) + 25;
  
  const urgencyElements = document.querySelectorAll('.urgency-text');
  urgencyElements.forEach(el => {
    const text = el.textContent;
    if (text.includes('spots left')) {
      el.innerHTML = text.replace(/\d+ free trials? left/, `${spots} free trials left`);
    }
  });
}

// =============================================================================
// MOBILE STICKY CTA
// =============================================================================

function setupMobileStickyCA() {
  const stickyCA = document.querySelector('.mobile-sticky-cta');
  if (!stickyCA) return;
  
  console.log('📱 [Home] Setting up mobile sticky CTA...');
  
  let isVisible = false;
  
  function toggleStickyCA() {
    const scrolled = window.pageYOffset > 500;
    
    if (scrolled && !isVisible) {
      stickyCA.style.transform = 'translateY(0)';
      isVisible = true;
      trackConversionEvent('mobile_cta_shown');
    } else if (!scrolled && isVisible) {
      stickyCA.style.transform = 'translateY(100%)';
      isVisible = false;
    }
  }
  
  // Initial hide
  stickyCA.style.transform = 'translateY(100%)';
  stickyCA.style.transition = 'transform 0.3s ease-in-out';
  
  let scrollTimeout;
  window.addEventListener('scroll', () => {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(toggleStickyCA, 50);
  });
  
  // Track clicks
  const mobileBtn = stickyCA.querySelector('.mobile-cta-btn');
  if (mobileBtn) {
    mobileBtn.addEventListener('click', () => {
      trackConversionEvent('mobile_cta_clicked');
      window.location.href = '/auth';
    });
  }
}

// =============================================================================
// TIME-BASED TRIGGERS
// =============================================================================

function setupTimeTriggers() {
  console.log('⏲️ [Home] Setting up time-based triggers...');
  
  // Track time on page
  setInterval(() => {
    conversionState.timeOnPage += 1;
  }, 1000);
  
  // Exit intent detection (desktop only)
  if (!window.matchMedia('(max-width: 768px)').matches) {
    document.addEventListener('mouseleave', (e) => {
      if (e.clientY <= 0 && !conversionState.ctaClicked) {
        trackConversionEvent('exit_intent', {
          timeOnPage: conversionState.timeOnPage,
          scrollDepth: conversionState.scrollDepth
        });
        
        // Could trigger exit intent modal here
        showExitIntentCTA();
      }
    });
  }
  
  // Idle detection
  let idleTimer;
  const idleTime = 30; // seconds
  
  function resetIdleTimer() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      if (!conversionState.ctaClicked) {
        trackConversionEvent('user_idle', {
          timeOnPage: conversionState.timeOnPage,
          scrollDepth: conversionState.scrollDepth
        });
      }
    }, idleTime * 1000);
  }
  
  ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
    document.addEventListener(event, resetIdleTimer, true);
  });
  
  resetIdleTimer();
}

function showExitIntentCTA() {
  // Simple exit intent - could enhance with modal
  const hero = document.querySelector('.hero-section');
  if (hero) {
    hero.style.borderTop = '5px solid #ff4444';
    setTimeout(() => {
      hero.style.borderTop = 'none';
    }, 3000);
  }
}

function trackConversionEvent(eventName, data = {}) {
  // Disabled - not collecting analytics
  return;
}
// =============================================================================
// STANDARD FUNCTIONALITY
// =============================================================================

async function initializeApp() {
  try {
    console.log("🚀 Initializing app...");
    await initializeSupabase();
    isInitialized = true;
    console.log("✅ Landing page initialized");
  } catch (error) {
    console.error("❌ Landing page initialization failed:", error);
    setupDemoMode();
  }
}

async function initializeFooter() {
  try {
    // Prevent duplicate initialization
    if (document.querySelector('.footer-main')) {
      console.log('🔄 [Home] Footer already exists, skipping initialization...');
      return;
    }
    
    console.log('🦶 [Home] Starting footer initialization...');
    
    // Check if container exists, create if missing
    let container = document.getElementById('footer-container');
    if (!container) {
      console.log('🔧 [Home] Creating footer-container element');
      container = document.createElement('div');
      container.id = 'footer-container';
      document.body.appendChild(container);
    }
    console.log('✅ [Home] Footer container found');
    
    // Wait for FooterManager to be available
    console.log('🔍 [Home] Waiting for FooterManager...');
    for (let i = 0; i < 50; i++) {
      if (window.FooterManager) {
        console.log('✅ [Home] FooterManager found');
        break;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    if (!window.FooterManager) {
      throw new Error('FooterManager not available after waiting');
    }
    
    // Initialize footer
    console.log('🦶 [Home] Creating FooterManager instance...');
    const footerManager = new window.FooterManager();
    
    console.log('🦶 [Home] Rendering footer...');
    footerManager.render('footer-container', {
      showSocialLinks: true,
      showNewsletter: true
    });
    
    console.log('✅ [Home] Footer initialization complete');
  } catch (error) {
    console.error('❌ [Home] Footer initialization failed:', error);
  }
}

async function initializeSupabase() {
  try {
    console.log("🔄 Waiting for SimpleAuth initialization...");
    
    let attempts = 0;
    while (attempts < 50) {
      if (window.SimpleAuth?.supabase?.from) {
        console.log("✅ SimpleAuth Supabase client available");
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    
    console.warn("⚠️ SimpleAuth not available. Demo mode only.");
  } catch (error) {
    console.error("❌ SimpleAuth initialization failed:", error);
    setupDemoMode();
  }
}

function setupDemoMode() {
  console.log("🎭 Setting up demo mode");
}

function setupEventListeners() {
  // Smooth scrolling for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
        
        trackConversionEvent('internal_navigation', {
          target: this.getAttribute('href')
        });
      }
    });
  });

  // Mobile menu functionality
  const mobileMenuButton = document.getElementById('mobile-menu-button');
  const mobileMenu = document.getElementById('mobile-menu');
  
  if (mobileMenuButton && mobileMenu) {
    mobileMenuButton.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden');
      trackConversionEvent('mobile_menu_toggled');
    });
  }

  // Close mobile menu when clicking outside
  document.addEventListener('click', (event) => {
    if (mobileMenu && mobileMenuButton && 
        !mobileMenu.contains(event.target) && 
        !mobileMenuButton.contains(event.target)) {
      mobileMenu.classList.add('hidden');
    }
  });
}

function setupAnimations() {
  // Show content once CSS is loaded
  setTimeout(() => {
    document.body.classList.add('show-content');
    trackConversionEvent('page_content_shown');
  }, 50);

  // Intersection Observer for scroll animations
  if ('IntersectionObserver' in window) {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-slide-in-up');
          
          // Track section views
          const sectionId = entry.target.id || entry.target.className;
          trackConversionEvent('section_viewed', { section: sectionId });
        }
      });
    }, observerOptions);

    // Observe main sections
    document.querySelectorAll('.benefits-section, .how-it-works-section, .social-proof-section, .final-cta-section').forEach(section => {
      observer.observe(section);
    });
  }
}

// Page visibility & engagement tracking
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    trackConversionEvent('page_hidden', {
      timeOnPage: conversionState.timeOnPage,
      scrollDepth: conversionState.scrollDepth
    });
  } else {
    trackConversionEvent('page_visible');
  }
});

window.addEventListener('beforeunload', () => {
  trackConversionEvent('page_unload', {
    timeOnPage: conversionState.timeOnPage,
    scrollDepth: conversionState.scrollDepth,
    demoUsed: conversionState.demoUsed,
    ctaClicked: conversionState.ctaClicked
  });
});

// Export state for homeHandlers.js to access
window.HomeState = {
  conversionState,
  trackConversionEvent
};

console.log('✅ [Home] Clean UI management loaded');

// EMERGENCY FALLBACK - Execute after script loads
console.log('🚨 [Home] EMERGENCY FALLBACK - Executing initialization...');
setTimeout(() => {
  const btn = document.getElementById('demo-analyze-btn');
  if (btn && !btn.onclick && (!btn._eventListeners || !btn._eventListeners.click)) {
    console.log('🚨 [Home] EMERGENCY - No event listeners detected, force initializing...');
    initializeHomePage();
  }
}, 1000);
