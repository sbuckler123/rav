/**
 * Vercel Serverless Function — Admin router
 *
 * Consolidates all admin sections into one function to stay within
 * Vercel Hobby plan's 12-function limit.
 *
 * Auth model:
 *   - Most sections require an active admin (Clerk JWT + Airtable user lookup).
 *   - The 'users' section additionally requires role = 'מנהל'.
 *   - POST /api/admin?section=questions&type=reply is the one public path —
 *     it accepts unauthenticated follow-ups from question askers, but the
 *     handler enforces strict input constraints when no admin context is set.
 *
 * Routes:
 *   /api/admin?section=questions  → admin questions + answers
 *   /api/admin?section=articles   → admin articles
 *   /api/admin?section=events     → admin events + gallery
 *   /api/admin?section=shiurim    → admin shiurim
 *   /api/admin?section=videos     → admin videos
 *   /api/admin?section=users      → admin users (Clerk + Airtable)
 *   /api/admin?section=cloudinary-sign
 *   /api/admin?section=al-haperek
 *   /api/admin?section=settings
 */

import type { IncomingMessage, ServerResponse } from 'http';
import { requireAdmin, tryAdminContext, type AdminContext } from './_verifyAuth';
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

/** Augmented request shape — handlers can read `req.adminCtx` after the router resolves auth. */
export type AdminRequest = IncomingMessage & { adminCtx?: AdminContext | null };

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  res.setHeader('Content-Type', 'application/json');
  // Admin responses must never be cached by browsers or shared CDNs.
  res.setHeader('Cache-Control', 'no-store');

  let section: string | null = null;
  try {
    const url = new URL(req.url ?? '/', 'https://placeholder');
    section   = url.searchParams.get('section');
    const type = url.searchParams.get('type');

    // Public follow-up reply: try to resolve admin context (so authed admins
    // keep their existing capabilities) but don't reject if it's missing —
    // the handler enforces stricter rules for unauthenticated callers.
    const isPublicReply =
      section === 'questions' && type === 'reply' && req.method === 'POST';

    if (isPublicReply) {
      (req as AdminRequest).adminCtx = await tryAdminContext(req);
    } else {
      const requiredRole = section === 'users' ? 'מנהל' : undefined;
      const ctx = await requireAdmin(req, res, { requiredRole });
      if (!ctx) return;
      (req as AdminRequest).adminCtx = ctx;
    }

    switch (section) {
      case 'questions':       return await handleQuestions(req, res);
      case 'articles':        return await handleArticles(req, res);
      case 'events':          return await handleEvents(req, res);
      case 'shiurim':         return await handleShiurim(req, res);
      case 'videos':          return await handleVideos(req, res);
      case 'users':           return await handleUsers(req, res);
      case 'cloudinary-sign': return await handleCloudinarySign(req, res);
      case 'al-haperek':      return await handleAlHaperek(req, res);
      case 'settings':        return await handleSettings(req, res);
      default:
        res.statusCode = 400;
        res.end(JSON.stringify({ error: 'Unknown section' }));
    }
  } catch (err) {
    captureServerError(err, { handler: 'admin', section: section ?? 'unknown', method: req.method ?? '' });
    if (!res.headersSent) {
      res.statusCode = 500;
      res.end(JSON.stringify({ error: 'Internal error' }));
    }
  }
}
