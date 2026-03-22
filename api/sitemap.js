// /api/sitemap.js — Auto-generates sitemap.xml from all posts in /posts/*.md
// Google crawls this automatically. New blog posts appear within 24-48 hours.
// No credentials, no API keys, no cost. Pure file reading.

const fs   = require('fs');
const path = require('path');

const DOMAIN = 'https://thepsychedelicdigest.com';

// All static pages on the site with their priority and change frequency
const STATIC_PAGES = [
  { url: '/',            priority: '1.0', changefreq: 'daily'   },
  { url: '/blog',        priority: '0.9', changefreq: 'daily'   },
  { url: '/glossary',    priority: '0.7', changefreq: 'monthly' },
  { url: '/legal-map',   priority: '0.7', changefreq: 'monthly' },
  { url: '/psyfinance',  priority: '0.6', changefreq: 'weekly'  },
  { url: '/jobs',        priority: '0.6', changefreq: 'weekly'  },
  { url: '/retreats',    priority: '0.6', changefreq: 'monthly' },
  { url: '/psilocybin',  priority: '0.8', changefreq: 'daily'   },
  { url: '/mdma',        priority: '0.8', changefreq: 'daily'   },
  { url: '/ketamine',    priority: '0.8', changefreq: 'daily'   },
  { url: '/lsd',         priority: '0.7', changefreq: 'daily'   },
  { url: '/cannabis',    priority: '0.7', changefreq: 'daily'   },
  { url: '/ayahuasca',   priority: '0.7', changefreq: 'daily'   },
  { url: '/policy',      priority: '0.7', changefreq: 'daily'   },
  { url: '/research',    priority: '0.8', changefreq: 'daily'   },
  { url: '/culture',     priority: '0.6', changefreq: 'daily'   },
];

function parseDateFromFrontmatter(raw) {
  const normalised = raw.replace(/\r\n/g, '\n');
  const match = normalised.match(/^---[\s\S]*?date:\s*([^\n]+)/);
  if (!match) return '';
  return match[1].trim();
}

function parseSlugDate(raw) {
  const date = parseDateFromFrontmatter(raw);
  if (!date) return new Date().toISOString().split('T')[0];
  return date;
}

module.exports = (req, res) => {
  const postsDir = path.join(process.cwd(), 'posts');
  let blogUrls = [];

  // Read all blog posts and generate their URLs
  if (fs.existsSync(postsDir)) {
    try {
      const files = fs.readdirSync(postsDir).filter(f => f.endsWith('.md'));
      blogUrls = files.map(file => {
        const slug    = file.replace('.md', '');
        const raw     = fs.readFileSync(path.join(postsDir, file), 'utf8');
        const lastmod = parseSlugDate(raw);
        return {
          url:        `/blog/${slug}`,
          priority:   '0.8',
          changefreq: 'monthly',
          lastmod,
        };
      }).sort((a, b) => b.lastmod.localeCompare(a.lastmod)); // newest first
    } catch(e) {
      blogUrls = [];
    }
  }

  const today = new Date().toISOString().split('T')[0];

  // Build the XML
  const urls = [
    // Static pages
    ...STATIC_PAGES.map(p => `
  <url>
    <loc>${DOMAIN}${p.url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`),
    // Blog posts
    ...blogUrls.map(p => `
  <url>
    <loc>${DOMAIN}${p.url}</loc>
    <lastmod>${p.lastmod}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`),
  ].join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

  res.setHeader('Content-Type', 'application/xml');
  res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=300');
  res.status(200).send(xml);
};
