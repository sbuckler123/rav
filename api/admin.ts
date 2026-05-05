/**
 * Vercel Serverless Function — Admin router
 *
 * Consolidates all admin sections into one function to stay within
 * Vercel Hobby plan's 12-function limit.
 *
 * All requests require Clerk JWT auth except:
 *   POST /api/admin?section=questions&type=reply  (public follow-up reply)
 *
 * Routes:
 *   /api/admin?section=questions  → admin questions + answers
 *   /api/admin?section=articles   → admin articles
 *   /api/admin?section=events     → admin events + gallery
 *   /api/admin?section=shiurim    → admin shiurim
 *   /api/admin?section=videos     → admin videos
 *   /api/admin?section=users      → admin users (Clerk + Airtable)
 */

import type { IncomingMessage, ServerResponse } from 'http';
import { requireAuth } from './_verifyAuth';
import { captureServerError } from './_sentry';
import { handle as handleQuestions }      from './_admin-questions';
import { handle as handleArticles }       from './_admin-articles';
import { handle as handleEvents }         from './_admin-events';
import { handle as handleShiurim }        from './_admin-shiurim';
import { handle as handleVideos }         from './_admin-videos';
import { handle as handleUsers }          from './_users';
import { handle as handleCloudinarySign } from './_cloudinary-sign';
import { handle as handleAlHaperek }      from './_admin-al-haperek';
import { handle as handleSettings }       from './_admin-settings';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  res.setHeader('Content-Type', 'application/json');

  let section: string | null = null;
  try {
    const url = new URL(req.url ?? '/', 'https://placeholder');
    section   = url.searchParams.get('section');
    const type = url.searchParams.get('type');

    // The public follow-up reply bypasses auth (submitted by question askers)
    const isPublicReply =
      section === 'questions' && type === 'reply' && req.method === 'POST';

    if (!isPublicReply) {
      if (!(await requireAuth(req, res))) return;
    }

    switch (section) {
      case 'questions':       return await handleQuestions(req, res);
      case 'articles':        return await handleArticles(req, res);
      case 'events':          return await handleEvents(req, res);
      case 'shiurim':         return await handleShiurim(req, res);
      case 'videos':          return await handleVideos(req, res);
      case 'users':           return await handleUsers(req, res);
      case 'cloudinary-sign': return await handleCloudinarySign(req, res);
      case 'al-haperek':     return await handleAlHaperek(req, res);
      case 'settings':       return await handleSettings(req, res);
      default:
        res.statusCode = 400;
        res.end(JSON.stringify({ error: 'Unknown section' }));
    }
  } catch (err) {
    captureServerError(err, { handler: 'admin', section: section ?? 'unknown', method: req.method ?? '' });
    if (!res.headersSent) {
      res.statusCode = 500;
      res.end(JSON.stringify({ error: err instanceof Error ? err.message : 'Internal error' }));
    }
  }
}
