const express = require('express');
const router = express.Router();

// In-memory store (would be replaced by a DB in production).
const sites = new Map();
let nextId = 1;

// List all hosted sites.
router.get('/', (req, res) => {
  res.json(Array.from(sites.values()));
});

// Get a single site by id.
router.get('/:id', (req, res) => {
  const site = sites.get(Number(req.params.id));
  if (!site) return res.status(404).json({ error: 'Site not found' });
  res.json(site);
});

/**
 * Returns true when `value` is a valid RFC 1123 hostname.
 *
 * Rules:
 *  - Total length: 1–253 characters.
 *  - Composed of one or more dot-separated labels.
 *  - Each label: 1–63 characters, containing only [a-zA-Z0-9-],
 *    and must not start or end with a hyphen.
 */
function isValidHostname(value) {
  if (typeof value !== 'string' || value.length === 0 || value.length > 253) {
    return false;
  }
  const labelPattern = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/;
  const labels = value.replace(/\.$/, '').split('.');
  return labels.every((label) => label.length > 0 && labelPattern.test(label));
}

// Create a new hosted site.
router.post('/', (req, res) => {
  const { domain, owner } = req.body;
  if (!domain || !owner) {
    return res.status(400).json({ error: 'domain and owner are required' });
  }
  if (!isValidHostname(domain)) {
    return res.status(400).json({
      error: `Invalid domain "${domain}". Must be a valid RFC 1123 hostname (e.g. "example.com").`,
    });
  }
  const site = { id: nextId++, domain, owner, createdAt: new Date().toISOString() };
  sites.set(site.id, site);
  res.status(201).json(site);
});

// Delete a hosted site.
router.delete('/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!sites.has(id)) return res.status(404).json({ error: 'Site not found' });
  sites.delete(id);
  res.status(204).send();
});

module.exports = router;
