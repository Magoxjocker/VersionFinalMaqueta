import { validationResult } from 'express-validator';

export function validateRequest(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    req.session.error = errors.array()[0].msg;
    const fallback = req.get('referer') || req.get('referrer') || req.originalUrl || '/';
    return res.redirect(fallback);
  }
  next();
}
