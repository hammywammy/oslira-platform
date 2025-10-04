import type { Context } from 'hono';
import type { Env } from '../types/interfaces.js';
import { generateRequestId, logger } from '../utils/logger.js';
import { createStandardResponse } from '../utils/response.js';
import { getApiKey } from '../services/enhanced-config-manager.js';
import { callWithRetry } from '../utils/helpers.js';

export async function handleScraperDataTest(c: Context<{ Bindings: Env }>): Promise<Response> {
  const requestId = generateRequestId();
  
  try {
    const { username } = await c.req.json();
    
    if (!username) {
      return c.json(createStandardResponse(false, undefined, 'username required', requestId), 400);
    }

    const apifyToken = await getApiKey('APIFY_API_TOKEN', c.env, c.env.APP_ENV);
    
    logger('info', 'Testing scraper data extraction', { username, requestId });

    // Test shu_deep scraper with 12 posts
    const scraperInput = {
      addParentData: false,
      directUrls: [`https://instagram.com/${username}/`],
      enhanceUserSearchWithFacebookPage: false,
      isUserReelFeedURL: false,
      isUserTaggedFeedURL: false,
      resultsLimit: 12,
      resultsType: "details",
      searchType: "hashtag"
    };

    const rawResponse = await callWithRetry(
      `https://api.apify.com/v2/acts/shu8hvrXbJbY3Eb9W/run-sync-get-dataset-items?token=${apifyToken}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scraperInput)
      },
      1, 1000, 60000
    );

    if (!rawResponse || !Array.isArray(rawResponse)) {
      return c.json(createStandardResponse(false, undefined, 'Invalid scraper response', requestId), 500);
    }

    // Analyze response structure
    const analysis = analyzeScraperResponse(rawResponse);

    return c.json(createStandardResponse(true, {
      username,
      raw_response: rawResponse,
      structure_analysis: analysis,
      extraction_recommendations: generateExtractionPlan(analysis)
    }, undefined, requestId));

  } catch (error: any) {
    logger('error', 'Scraper test failed', { error: error.message, requestId });
    return c.json(createStandardResponse(false, undefined, error.message, requestId), 500);
  }
}

function analyzeScraperResponse(response: any[]): any {
  const firstItem = response[0];
  const analysis = {
    total_items: response.length,
    first_item_type: firstItem?.type || firstItem?.__typename || 'unknown',
    
    // User fields present
    user_fields: {
      basic: [] as string[],
      social: [] as string[],
      business: [] as string[],
      external: [] as string[]
    },
    
    // Post data analysis
    posts: {
      found: false,
      count: 0,
      sample_fields: [] as string[],
      has_engagement: false,
      has_content: false,
      has_location: false,
      has_tagged_users: false
    },
    
    // Related data
    related: {
      has_related_profiles: false,
      has_hashtags: false,
      has_mentions: false
    }
  };

  // Analyze user fields
  const userFieldCategories = {
    basic: ['username', 'fullName', 'biography', 'profilePicUrl', 'profilePicUrlHD'],
    social: ['followersCount', 'followsCount', 'postsCount', 'verified', 'private'],
    business: ['isBusinessAccount', 'businessCategoryName'],
    external: ['externalUrl', 'externalUrlShimmed', 'externalUrls']
  };

  Object.entries(userFieldCategories).forEach(([category, fields]) => {
    fields.forEach(field => {
      if (firstItem[field] !== undefined) {
        analysis.user_fields[category].push(field);
      }
    });
  });

  // Check for posts
  if (response.length > 1) {
    const secondItem = response[1];
    if (secondItem.shortCode || secondItem.id) {
      analysis.posts.found = true;
      analysis.posts.count = response.length - 1;
      analysis.posts.sample_fields = Object.keys(secondItem);
      analysis.posts.has_engagement = !!(secondItem.likesCount || secondItem.commentsCount);
      analysis.posts.has_content = !!(secondItem.caption);
      analysis.posts.has_location = !!(secondItem.location);
      analysis.posts.has_tagged_users = !!(secondItem.taggedUsers?.length);
    }
  }

  // Check related data
  analysis.related.has_related_profiles = !!(firstItem.relatedProfiles?.length);
  analysis.related.has_hashtags = !!(firstItem.hashtags?.length);
  analysis.related.has_mentions = !!(firstItem.mentions?.length);

  return analysis;
}

function generateExtractionPlan(analysis: any): any {
  return {
    user_extraction: {
      available_fields: [
        ...analysis.user_fields.basic,
        ...analysis.user_fields.social,
        ...analysis.user_fields.business,
        ...analysis.user_fields.external
      ],
      missing_from_current: identifyMissingFields(analysis)
    },
    posts_extraction: {
      can_extract: analysis.posts.found,
      post_count: analysis.posts.count,
      available_metrics: analysis.posts.sample_fields,
      engagement_available: analysis.posts.has_engagement,
      content_available: analysis.posts.has_content
    },
    related_extraction: {
      related_profiles: analysis.related.has_related_profiles,
      hashtags: analysis.related.has_hashtags,
      mentions: analysis.related.has_mentions
    }
  };
}

function identifyMissingFields(analysis: any): string[] {
  const currentlyExtracted = [
    'username', 'fullName', 'biography', 'followersCount', 
    'followsCount', 'postsCount', 'verified', 'private',
    'profilePicUrl', 'externalUrl', 'isBusinessAccount'
  ];

  const allAvailable = [
    ...analysis.user_fields.basic,
    ...analysis.user_fields.social,
    ...analysis.user_fields.business,
    ...analysis.user_fields.external
  ];

  return allAvailable.filter(field => !currentlyExtracted.includes(field));
}
