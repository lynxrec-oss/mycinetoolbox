// Meta Graph API Integration for Facebook Page and Instagram Professional Publishing
// Documentation: https://developers.facebook.com/docs/graph-api

const API_VERSION = 'v20.0';
const BASE_URL = `https://graph.facebook.com/${API_VERSION}`;

export interface FacebookPage {
  id: string;
  name: string;
  access_token: string;
  category: string;
}

export interface InstagramAccount {
  id: string;
  username: string;
  name?: string;
  profile_picture_url?: string;
}

/**
 * Fetches the user's administered Facebook Pages using their user access token.
 */
export async function fetchFacebookPages(fbUserToken: string): Promise<FacebookPage[]> {
  const url = `${BASE_URL}/me/accounts?access_token=${fbUserToken}&limit=100`;
  const response = await fetch(url);

  if (!response.ok) {
    const errData = await response.json();
    throw new Error(errData?.error?.message || `Meta Graph API error fetching pages (${response.status})`);
  }

  const result = await response.json();
  return (result.data || []) as FacebookPage[];
}

/**
 * Retrieves the connected Instagram Business account for a specific Facebook Page.
 */
export async function fetchInstagramBusinessAccount(
  pageAccessToken: string,
  pageId: string
): Promise<InstagramAccount | null> {
  // 1. Fetch connected Instagram Business Account ID
  const url = `${BASE_URL}/${pageId}?fields=instagram_business_account&access_token=${pageAccessToken}`;
  const response = await fetch(url);

  if (!response.ok) {
    const errData = await response.json();
    throw new Error(errData?.error?.message || `Meta Graph API error fetching Instagram ID (${response.status})`);
  }

  const result = await response.json();
  const igId = result.instagram_business_account?.id;
  if (!igId) return null;

  // 2. Fetch profile details (username, profile picture) for the Instagram account
  const detailUrl = `${BASE_URL}/${igId}?fields=username,name,profile_picture_url&access_token=${pageAccessToken}`;
  const detailResponse = await fetch(detailUrl);

  if (!detailResponse.ok) {
    // Fall back to just ID and empty details if metadata fetch fails
    return { id: igId, username: 'business_account' };
  }

  const detailResult = await detailResponse.json();
  return {
    id: igId,
    username: detailResult.username,
    name: detailResult.name,
    profile_picture_url: detailResult.profile_picture_url
  };
}

/**
 * Publishes a text message post with an optional link to a Facebook Page.
 */
export async function publishFacebookPost(
  pageAccessToken: string,
  pageId: string,
  message: string,
  link?: string
): Promise<string> {
  const url = `${BASE_URL}/${pageId}/feed`;
  
  const params = new URLSearchParams();
  params.append('message', message);
  params.append('access_token', pageAccessToken);
  if (link) {
    params.append('link', link);
  }

  const response = await fetch(url, {
    method: 'POST',
    body: params
  });

  if (!response.ok) {
    const errData = await response.json();
    throw new Error(errData?.error?.message || `Meta Graph API failed to post to Facebook (${response.status})`);
  }

  const result = await response.json();
  return result.id; // Returns post ID
}

/**
 * Publishes an image post directly to a connected Instagram Business account.
 * (Note: Meta requires a public image URL for programmatic publishing)
 */
export async function publishInstagramPost(
  pageAccessToken: string,
  igAccountId: string,
  imageUrl: string,
  caption: string
): Promise<string> {
  // Step 1: Create a media container
  const containerUrl = `${BASE_URL}/${igAccountId}/media`;
  const containerParams = new URLSearchParams();
  containerParams.append('image_url', imageUrl);
  containerParams.append('caption', caption);
  containerParams.append('access_token', pageAccessToken);

  const response = await fetch(containerUrl, {
    method: 'POST',
    body: containerParams
  });

  if (!response.ok) {
    const errData = await response.json();
    throw new Error(errData?.error?.message || `Meta Graph API failed to create IG container (${response.status})`);
  }

  const containerResult = await response.json();
  const creationId = containerResult.id;

  // Step 2: Publish the media container
  const publishUrl = `${BASE_URL}/${igAccountId}/media_publish`;
  const publishParams = new URLSearchParams();
  publishParams.append('creation_id', creationId);
  publishParams.append('access_token', pageAccessToken);

  const publishResponse = await fetch(publishUrl, {
    method: 'POST',
    body: publishParams
  });

  if (!publishResponse.ok) {
    const errData = await publishResponse.json();
    throw new Error(errData?.error?.message || `Meta Graph API failed to publish IG media (${publishResponse.status})`);
  }

  const publishResult = await publishResponse.json();
  return publishResult.id; // Returns IG media ID
}
