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
import { handle as handleQuestions } from './_admin-questions';
import { handle as handleArticles }  from './_admin-articles';
import { handle as handleEvents }    from './_admin-events';
import { handle as handleShiurim }   from './_admin-shiurim';
import { handle as handleVideos }    from './_admin-videos';
import { handle as handleUsers }     from './_users';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  res.setHeader('Content-Type', 'application/json');

  const url     = new URL(req.url ?? '/', 'https://placeholder');
  const section = url.searchParams.get('section');
  const type    = url.searchParams.get('type');

  // The public follow-up reply bypasses auth (submitted by question askers)
  const isPublicReply =
    section === 'questions' && type === 'reply' && req.method === 'POST';

  if (!isPublicReply) {
    if (!(await requireAuth(req, res))) return;
  }

  switch (section) {
    case 'questions': return handleQuestions(req, res);
    case 'articles':  return handleArticles(req, res);
    case 'events':    return handleEvents(req, res);
    case 'shiurim':   return handleShiurim(req, res);
    case 'videos':    return handleVideos(req, res);
    case 'users':     return handleUsers(req, res);
    default:
      res.statusCode = 400;
      res.end(JSON.stringify({ error: 'Unknown section' }));
  }
}
