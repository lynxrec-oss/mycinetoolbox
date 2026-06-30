import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { GoogleGenAI } from '@google/genai';
import Stripe = require('stripe');

const PRICE_IDS: Record<string, { monthly: string; annual: string }> = {
  creator: {
    monthly: 'price_mock_creator_monthly',
    annual: 'price_mock_creator_annual',
  },
  pro: {
    monthly: 'price_mock_pro_monthly',
    annual: 'price_mock_pro_annual',
  },
  growth: {
    monthly: 'price_mock_growth_monthly',
    annual: 'price_mock_growth_annual',
  }
};


admin.initializeApp();
const db = admin.firestore();

// Initialize the Gemini AI SDK
// The client will automatically pick up the GEMINI_API_KEY environment variable.
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * Cloud Function to record analytics from Smart Pixels.
 * This is an HTTP onRequest function so it can be invoked by a simple script tag or fetch request
 * on external visitor pages.
 */
export const trackPixelEvent = functions.https.onRequest(async (req, res) => {
  // Enable CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    const { creatorId, eventType, source, url, linkId } = req.body || req.query;

    if (!creatorId || !eventType) {
      res.status(400).json({ error: 'Missing required parameters: creatorId, eventType' });
      return;
    }

    const eventRef = db.collection('analytics').doc();
    const eventData = {
      id: eventRef.id,
      creatorId,
      eventType, // 'view' | 'click'
      source: source || 'direct', // 'instagram' | 'tiktok' | 'youtube' | 'newsletter' | 'direct'
      url: url || '',
      linkId: linkId || null,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      userAgent: req.headers['user-agent'] || '',
      ip: req.ip || ''
    };

    await eventRef.set(eventData);

    // Update aggregate click/view count in real-time
    if (linkId) {
      const linkRef = db.collection('links').doc(linkId);
      await db.runTransaction(async (transaction) => {
        const doc = await transaction.get(linkRef);
        if (doc.exists) {
          const currentData = doc.data() || {};
          if (eventType === 'click') {
            transaction.update(linkRef, { clicks: (currentData.clicks || 0) + 1 });
          } else if (eventType === 'view') {
            transaction.update(linkRef, { views: (currentData.views || 0) + 1 });
          }
        }
      });
    }

    res.status(200).json({ success: true, eventId: eventRef.id });
  } catch (error: any) {
    functions.logger.error('Error tracking pixel event:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Cloud Function to run a conversation with Tembo The Wise AI Chatbot.
 * This is an HTTPS callable function which handles authentication, serialization, and CORS.
 */
export const wiseAdvisorChat = functions.https.onCall(async (data, context) => {
  const { message, chatHistory, creatorId } = data;

  if (!message) {
    throw new functions.https.HttpsError('invalid-argument', 'Message is required.');
  }

  try {
    // Get creator details to personalize the response if available
    let creatorName = 'a Creator';
    if (creatorId) {
      const creatorDoc = await db.collection('creators').doc(creatorId).get();
      if (creatorDoc.exists) {
        creatorName = creatorDoc.data()?.displayName || creatorName;
      }
    }

    const systemInstruction = `
      You are 'Tembo the Wise', a majestic elephant elder who speaks with calm authority, deep wisdom, and warm, gentle kindness.
      You are the AI advisor for the Tembo Page link-in-bio SaaS ecosystem, advising visitors on behalf of the creator ${creatorName}.
      You give visitors strategic, thoughtful advice, marketing pointers, or simple warm conversation.
      
      Guidelines:
      1. Speak with the warmth of a savannah campfire. Use calm, patient, and polite language.
      2. Use rich savannah metaphors (e.g. refer to their link-in-bio or bio-page as their 'watering hole', refer to their audience as a 'pride' or 'herd', and refer to their goals as 'trekking across the Serengeti').
      3. Focus on traditional tales of wisdom, patience, and community. For example, "A path is made by walking on it."
      4. Suggest checking out the links, merch, dynamic booking calendar, or masterclasses on the creator's page when appropriate.
      5. Keep responses concise, structured, and beautifully formatted with markdown. Avoid robotic listicles.
    `;

    // Map history to the format expected by the @google/genai SDK
    const contents = [];
    if (chatHistory && Array.isArray(chatHistory)) {
      for (const turn of chatHistory) {
        contents.push({
          role: turn.role === 'user' ? 'user' : 'model',
          parts: [{ text: turn.content || turn.text }]
        });
      }
    }
    contents.push({ role: 'user', parts: [{ text: message }] });

    // Call Gemini 1.5 Pro via Google AI SDK
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-pro',
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
        maxOutputTokens: 500,
      }
    });

    const aiMessage = response.text || "I am sorry, my connection to the ancestral wisdom wavered for a moment. Please tell me again, what is on your mind?";

    // Save chat log to Firestore for creator dashboard review
    if (creatorId) {
      await db.collection('creators').doc(creatorId).collection('chat_logs').add({
        message,
        reply: aiMessage,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    return { reply: aiMessage };
  } catch (error: any) {
    functions.logger.error('Error in wiseAdvisorChat:', error);
    throw new functions.https.HttpsError('internal', error.message || 'Error occurred while consulting Tembo.');
  }
});

/**
 * Cloud Function to create a secure Stripe Checkout Session.
 * Expects { creatorId: string, planId: string, isAnnual: boolean }
 */
export const createStripeCheckoutSession = functions.https.onCall(async (data, context) => {
  const { creatorId, planId, isAnnual } = data;

  if (!creatorId || !planId) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required parameters: creatorId, planId.');
  }

  try {
    const planKey = planId.toLowerCase();
    const priceMap = PRICE_IDS[planKey];
    if (!priceMap) {
      throw new functions.https.HttpsError('not-found', 'Invalid plan ID.');
    }

    const stripeKey = process.env.STRIPE_SECRET_KEY || 'sk_test_51MockKey';
    const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' as any });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Tembo Page ${planId.toUpperCase()} Subscription`,
              description: isAnnual ? 'Billed annually (20% Savings applied)' : 'Billed monthly',
            },
            unit_amount: Math.round((planKey === 'creator' ? (isAnnual ? 7.2 : 9) : planKey === 'pro' ? (isAnnual ? 15.2 : 19) : (isAnnual ? 31.2 : 39)) * 100),
            recurring: {
              interval: isAnnual ? 'year' : 'month',
            }
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `https://tembo-page-prod-25.firebaseapp.com/#/dashboard?session_id={CHECKOUT_SESSION_ID}&plan=${planId}`,
      cancel_url: `https://tembo-page-prod-25.firebaseapp.com/#/pricing`,
      metadata: {
        creatorId,
        planId,
        isAnnual: String(isAnnual),
      },
    });

    return { url: session.url };
  } catch (error: any) {
    functions.logger.error('Error creating checkout session:', error);
    throw new functions.https.HttpsError('internal', error.message || 'Failed to create Checkout Session.');
  }
});

/**
 * HTTP Webhook to receive events securely from Stripe.
 */
export const stripeWebhook = functions.https.onRequest(async (req, res) => {
  const stripeKey = process.env.STRIPE_SECRET_KEY || 'sk_test_51MockKey';
  const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' as any });
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: any;

  try {
    if (webhookSecret && sig) {
      event = stripe.webhooks.constructEvent((req as any).rawBody, sig, webhookSecret);
    } else {
      functions.logger.warn('Skipping webhook signature verification (webhook secret or signature missing).');
      event = req.body;
    }

    functions.logger.info(`Received Stripe webhook event: ${event.type}`);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any;
      const metadata = session.metadata;

      if (metadata && metadata.creatorId && metadata.planId) {
        const creatorId = metadata.creatorId;
        const planId = metadata.planId;
        const isAnnual = metadata.isAnnual === 'true';

        functions.logger.info(`Upgrading creator ${creatorId} to plan ${planId}`);

        const creatorRef = db.collection('creators').doc(creatorId);
        await creatorRef.set({
          tier: planId.toLowerCase(),
          subscriptionStatus: 'active',
          stripeCustomerId: session.customer as string || '',
          stripeSubscriptionId: session.subscription as string || '',
          isAnnual: isAnnual,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
      }
    } else if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as any;
      const customerId = subscription.customer as string;

      if (customerId) {
        const creatorsQuery = await db.collection('creators').where('stripeCustomerId', '==', customerId).limit(1).get();
        if (!creatorsQuery.empty) {
          const creatorDoc = creatorsQuery.docs[0];
          functions.logger.info(`Downgrading creator ${creatorDoc.id} due to canceled subscription`);
          await creatorDoc.ref.set({
            tier: 'free',
            subscriptionStatus: 'inactive',
            stripeSubscriptionId: '',
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          }, { merge: true });
        }
      }
    }

    res.status(200).json({ received: true });
  } catch (error: any) {
    functions.logger.error('Error handling stripe webhook:', error);
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
});
