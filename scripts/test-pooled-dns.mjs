import dns from 'node:dns'
import { Pool } from 'pg'

const origLookup = dns.lookup
const resolver = new dns.Resolver()
resolver.setServers(['8.8.8.8', '1.1.1.1'])

dns.lookup = function (hostname, options, callback) {
  let cb = callback
  let opt = options
  if (typeof options === 'function') {
    cb = options
    opt = {}
  }
  if (typeof hostname === 'string' && hostname.endsWith('.neon.tech')) {
    resolver.resolve4(hostname, (err, addrs) => {
      if (!err && addrs && addrs.length > 0) {
        if (opt && opt.all) {
          return cb(null, addrs.map((a) => ({ address: a, family: 4 })))
        }
        return cb(null, addrs[0], 4)
      }
      return origLookup(hostname, opt, cb)
    })
  } else {
    return origLookup(hostname, opt, cb)
  }
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL_POOLED || process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

async function test() {
  console.log('Connecting to pool...')
  const res = await pool.query('SELECT 1 as success')
  console.log('QUERY SUCCESS:', res.rows)
  await pool.end()
}

test().catch((err) => {
  console.error('TEST ERROR:', err)
  process.exit(1)
})
