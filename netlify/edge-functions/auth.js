export default async function (request) {
  const url = new URL(request.url);
  
  // Public endpoints that don't require authentication
  const publicEndpoints = [
    '/api/config',
    '/api/health'
  ];
  
  // Allow public endpoints without authentication 
  if (publicEndpoints.includes(url.pathname)) {
    switch (url.pathname) {  
      case '/api/config':
        return handleConfig(request);
      case '/api/health':
        return new Response(
          JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }),
          { headers: { 'Content-Type': 'application/json' } }
        );
    }
  }
  
  // All other /api/* routes require authentication
  return requireAuth(request);
}

async function handleConfig(request) {
  try {
    const url = new URL(request.url);
    const hostname = url.hostname;
    
    // Environment detection
    const isProduction = hostname === 'oslira.com';
    const isStaging = hostname === 'oslira.org' || hostname.includes('osliratest');
    
    // Worker URL based on environment
    const workerUrl = isProduction ? 
      'https://api.oslira.com' : 
      'https://api-staging.oslira.com';
    
    console.log('🔧 [Netlify Edge] Fetching config from Cloudflare Worker:', workerUrl);
    
    // Fetch configuration from your Cloudflare Worker (which has AWS access)
    const configResponse = await fetch(`${workerUrl}/api/public-config`, {
      headers: {
        'User-Agent': 'Netlify-Edge-Function',
        'Accept': 'application/json'
      }
    });
    
    if (!configResponse.ok) {
      throw new Error(`Worker responded with ${configResponse.status}`);
    }
    
    const config = await configResponse.json();
    
    console.log('✅ [Netlify Edge] Config fetched successfully from Worker');
    
    return new Response(JSON.stringify(config), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=300'
      }
    });
    
  } catch (error) {
    console.error('❌ [Netlify Edge] Failed to fetch config from Worker:', error);
    
    // Fallback configuration
    const fallbackConfig = {
      supabaseUrl: 'https://jswzzihuqtjqvobfosks.supabase.co',
      supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impzd3p6aWh1cXRqcXZvYmZvc2tzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NzQ3NjcsImV4cCI6MjA1MDU1MDc2N30.Z7EQBfC8N4QQjl8uIi-cGLM4-MJb4LrUa1Dz6kqBWPU',
      workerUrl,
      fallback: true
    };
    
    return new Response(JSON.stringify(fallbackConfig), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=60'
      }
    });
  }
}

async function requireAuth(request) {
  const authHeader = request.headers.get("authorization") || "";
  
  if (!authHeader.startsWith("Bearer ")) {
    return new Response(
      JSON.stringify({ error: "Authentication required" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }
  
  const token = authHeader.substring(7);
  
  try {
    // Verify with Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration missing');
    }
    
    const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': supabaseKey
      }
    });
    
    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }
    
    const user = await response.json();
    
    return new Response(
      JSON.stringify({ 
        message: "Authorized",
        user: { 
          id: user.id, 
          email: user.email 
        } 
      }),
      { headers: { "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error('Auth verification error:', error);
    return new Response(
      JSON.stringify({ error: "Authentication failed" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
