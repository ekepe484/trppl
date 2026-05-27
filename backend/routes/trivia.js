// backend/routes/trivia.js
const express   = require('express');
const Anthropic = require('@anthropic-ai/sdk');
const config    = require('../config');
const { triviaLimiter } = require('../middleware');
const router    = express.Router();
const client    = new Anthropic({ apiKey: config.anthropic.apiKey });

const COUNTRY_NAMES = {
  GB:'United Kingdom',US:'United States',CA:'Canada',AU:'Australia',FR:'France',
  DE:'Germany',ES:'Spain',MX:'Mexico',BR:'Brazil',PT:'Portugal',IT:'Italy',
  NL:'Netherlands',RU:'Russia',AE:'United Arab Emirates',SA:'Saudi Arabia',
  IN:'India',CN:'China',JP:'Japan',KR:'South Korea',ID:'Indonesia',PH:'Philippines',
  NG:'Nigeria',ZA:'South Africa',KE:'Kenya',EG:'Egypt',TR:'Turkey',PL:'Poland',
  SE:'Sweden',NO:'Norway',DK:'Denmark',FI:'Finland',GR:'Greece',AR:'Argentina',
  CO:'Colombia',CL:'Chile',PE:'Peru',PK:'Pakistan',BD:'Bangladesh',TH:'Thailand',
  MY:'Malaysia',SG:'Singapore',INTL:'the World',
};

function isValidCountry(code) {
  return typeof code === 'string' && /^[A-Z]{2,4}$/.test(code) && COUNTRY_NAMES[code] !== undefined;
}

router.post('/questions', triviaLimiter, async (req, res, next) => {
  try {
    const { country } = req.body;
    if (!country || !isValidCountry(country))
      return res.status(400).json({ error: 'Invalid or unsupported country code.' });
    if (!config.anthropic.apiKey)
      return res.status(503).json({ error: 'Trivia service unavailable.' });

    const name = COUNTRY_NAMES[country];
    const prompt = `Generate exactly 10 trivia questions about ${name}. Cover history, culture, sports, geography, food, and famous people.\n\nReturn ONLY a valid JSON array — no markdown, no explanation. Each element:\n- "q": question string\n- "opts": exactly 4 answer strings\n- "a": integer 0–3 (correct answer index)\n- "cat": short category with emoji (e.g. "🏆 Sports")`;

    const message = await client.messages.create({
      model: config.anthropic.model, max_tokens: config.anthropic.maxTokens,
      messages: [{ role: 'user', content: prompt }],
    });
    const raw  = message.content.map(b => b.text || '').join('');
    const qs   = JSON.parse(raw.replace(/```json|```/g,'').trim());
    if (!Array.isArray(qs) || qs.length < 5) throw new Error('Bad format');

    const sanitised = qs.slice(0,10).map(q => ({
      q:    String(q.q||'').slice(0,300),
      opts: Array.isArray(q.opts) ? q.opts.slice(0,4).map(o=>String(o).slice(0,150)) : [],
      a:    Number.isInteger(q.a)&&q.a>=0&&q.a<=3 ? q.a : 0,
      cat:  String(q.cat||'🧠 Trivia').slice(0,40),
    }));

    res.json({ questions: sanitised, country, countryName: name });
  } catch (err) {
    if (err instanceof SyntaxError) return res.status(502).json({ error: 'Failed to parse AI response.' });
    next(err);
  }
});

router.get('/countries', (req, res) => { res.json({ countries: COUNTRY_NAMES }); });

module.exports = router;
