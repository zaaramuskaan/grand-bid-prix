// Build relay: teams POST their locked-in build code, the pit wall reads them back. Open to anyone with the event id.
// One private blob per team: events/<eventId>/<teamId>.json
const { put, get, list } = require('@vercel/blob');

const ID = /^[A-Za-z0-9_-]{1,32}$/;
const cors = res => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'content-type,x-host-pin');
  res.setHeader('Cache-Control', 'no-store');
};
const readJSON = req => new Promise(resolve => {
  if (req.body && typeof req.body === 'object') return resolve(req.body);
  let s = ''; req.on('data', c => { s += c; if (s.length > 20000) req.destroy(); }); req.on('end', () => { try { resolve(JSON.parse(s || '{}')); } catch (e) { resolve({}); } });
});

module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  try {
    if (req.method === 'POST') {
      const b = await readJSON(req), id = String(b.id || ''), team = String(b.team || ''), code = String(b.code || '');
      if (!ID.test(id) || !ID.test(team) || !/^AGP1\.[A-Za-z0-9_-]{10,6000}$/.test(code)) return res.status(400).json({error: 'bad request'});
      const entry = {team, code, car: String(b.car || '').slice(0, 30), at: Date.now()};
      await put(`events/${id}/${team}.json`, JSON.stringify(entry), {access: 'private', contentType: 'application/json', addRandomSuffix: false, allowOverwrite: true, cacheControlMaxAge: 60});
      return res.status(200).json({ok: true, at: entry.at});
    }
    if (req.method === 'GET') {
      const id = String((req.query && req.query.id) || '');
      if (!id) return res.status(200).json({ok: true});
      if (!ID.test(id)) return res.status(400).json({error: 'bad event id'});
      const teams = String((req.query && req.query.teams) || '').split(',').filter(t => ID.test(t)).slice(0, 40);
      let paths = teams.map(t => `events/${id}/${t}.json`);
      if (!paths.length) { const {blobs} = await list({prefix: `events/${id}/`, limit: 100}); paths = blobs.map(bl => bl.pathname); }
      const builds = {};
      await Promise.all(paths.map(async pn => {
        try { const r = await get(pn, {access: 'private', useCache: false}); if (r && r.statusCode === 200) { const e = JSON.parse(await new Response(r.stream).text()); if (e && e.team) builds[e.team] = e; } } catch (e) {}
      }));
      return res.status(200).json({ok: true, builds});
    }
    return res.status(405).json({error: 'method'});
  } catch (e) {
    return res.status(500).json({error: 'relay error'});
  }
};
