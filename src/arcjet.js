import arcjet, { detectBot, shield, slidingWindow } from "@arcjet/node";

const arcjetkey = process.env.ARCJET_KEY;
const arcjetmode = process.env.ARCJET_MODE === 'DRY_RUN' ? 'DRY_RUN' : 'LIVE';

if(!arcjetkey) {
    console.warn('ARCJET_KEY is not set. Arcjet integration will be disabled.');
}

export const httpArcjet = arcjetkey ? arcjet({
    key: arcjetkey, 
    rules: [
        shield({mode: arcjetmode}),
        detectBot({mode: arcjetmode, allow: ['CATEGORY:SEARCH_ENGINE', 'CATEGORY:PREVIEW']}),
        slidingWindow({mode: arcjetmode, interval : '10s', max: 50}),
     ]
}) : null;

export const wsArcjet = arcjetkey ? arcjet({
    key: arcjetkey,
    rules: [
        shield({mode: arcjetmode}),
        detectBot({mode: arcjetmode, allow: ['CATEGORY:SEARCH_ENGINE', 'CATEGORY:PREVIEW']}),
        slidingWindow({mode: arcjetmode, interval : '2s', max: 5}),
     ]
}) : null;

export function securityMiddleware() {
    return async (req, res, next) => {
        if(!httpArcjet) {
            return next();
        }   

        try{
            const decision = await httpArcjet.protect(req);

            if(decision.isDenied()){
                if(decision.reason.isRateLimit()){
                    return res.status(429).json({ error: 'Too many requests. Please try again later.' });
                }
                return res.status(403).json({ error: 'Access denied.' });
            }
        }catch (error) {
            console.error('Error in Arcjet middleware:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }

        next();
    }
}