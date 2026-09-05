import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { requireAuth, AuthRequest } from './src/middleware/auth.ts';
import {
  getInventoryItems,
  createInventoryItem,
  updateInventoryItem,
  adjustItemStock,
  deleteInventoryItem,
  getCategories,
  createCategory,
  getRecentTransactions,
  getInventoryMetrics,
  getOrCreateUser,
} from './src/db/queries.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Real-time synchronization using Server-Sent Events (SSE)
interface SSEClient {
  id: number;
  res: Response;
}

let clients: SSEClient[] = [];
let nextClientId = 1;

export function broadcastUpdate(eventType: string, data: any) {
  const payload = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
  clients.forEach((client) => {
    try {
      client.res.write(payload);
    } catch (err) {
      console.error(`Failed to send event to client ${client.id}:`, err);
    }
  });
}

// Keep-alive heartbeat for SSE connections
setInterval(() => {
  clients.forEach((client) => {
    try {
      client.res.write(': heartbeat\n\n');
    } catch {
      // client dropped, will be removed on close
    }
  });
}, 20000);

// SSE endpoint for live real-time sync
app.get('/api/events', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const clientId = nextClientId++;
  const newClient: SSEClient = { id: clientId, res };
  clients.push(newClient);

  // Send initial welcome message
  res.write(`event: connected\ndata: ${JSON.stringify({ clientId, timestamp: Date.now() })}\n\n`);

  req.on('close', () => {
    clients = clients.filter((c) => c.id !== clientId);
  });
});

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// User sync endpoint
app.post('/api/auth/sync', requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user?.uid;
    const email = req.user?.email || '';
    const { displayName } = req.body;

    if (!uid) {
      return res.status(400).json({ error: 'Missing UID' });
    }

    const user = await getOrCreateUser(uid, email, displayName);
    res.json({ success: true, user });
  } catch (error: any) {
    console.error('Error syncing user:', error);
    res.status(500).json({ error: error.message || 'Failed to sync user' });
  }
});

// Fetch inventory items
app.get('/api/items', async (req, res) => {
  try {
    const search = req.query.search as string | undefined;
    const category = req.query.category as string | undefined;
    const items = await getInventoryItems(search, category);
    res.json(items);
  } catch (error: any) {
    console.error('Failed to get items:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch items' });
  }
});

// Create inventory item
app.post('/api/items', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { sku, name, category, description, quantity, minThreshold, unitPrice, gstRate, hsnCode, location, supplier } = req.body;

    if (!sku || !name) {
      return res.status(400).json({ error: 'SKU and Name are required.' });
    }

    const performedBy = req.user?.email || req.user?.uid || 'Unknown';

    const newItem = await createInventoryItem({
      sku: sku.trim(),
      name: name.trim(),
      category: category || 'General',
      description,
      quantity: Number(quantity) || 0,
      minThreshold: Number(minThreshold) || 5,
      unitPrice: String(unitPrice || '0.00'),
      gstRate: String(gstRate || '18.00'),
      hsnCode: hsnCode ? String(hsnCode).trim() : undefined,
      location,
      supplier,
      performedBy,
    });

    broadcastUpdate('inventory_updated', { action: 'create', item: newItem });
    res.status(201).json(newItem);
  } catch (error: any) {
    console.error('Failed to create item:', error);
    res.status(500).json({ error: error.message || 'Failed to create item' });
  }
});

// Update inventory item
app.put('/api/items/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid ID' });
    }

    const performedBy = req.user?.email || req.user?.uid || 'Unknown';
    const { sku, name, category, description, minThreshold, unitPrice, gstRate, hsnCode, location, supplier } = req.body;

    const updated = await updateInventoryItem(id, {
      sku,
      name,
      category,
      description,
      minThreshold: minThreshold !== undefined ? Number(minThreshold) : undefined,
      unitPrice: unitPrice !== undefined ? String(unitPrice) : undefined,
      gstRate: gstRate !== undefined ? String(gstRate) : undefined,
      hsnCode: hsnCode !== undefined ? String(hsnCode).trim() : undefined,
      location,
      supplier,
      performedBy,
    });

    broadcastUpdate('inventory_updated', { action: 'update', item: updated });
    res.json(updated);
  } catch (error: any) {
    console.error('Failed to update item:', error);
    res.status(500).json({ error: error.message || 'Failed to update item' });
  }
});

// Adjust item stock quantity
app.post('/api/items/:id/stock', requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid ID' });
    }

    const { change, type, notes } = req.body;
    if (typeof change !== 'number' || change === 0) {
      return res.status(400).json({ error: 'Valid quantity change required' });
    }

    const validTypes = ['RESTOCK', 'DISPATCH', 'ADJUSTMENT'];
    const movementType = validTypes.includes(type) ? type : 'ADJUSTMENT';
    const performedBy = req.user?.email || req.user?.uid || 'Unknown';

    const updated = await adjustItemStock(id, change, movementType, notes, performedBy);

    broadcastUpdate('inventory_updated', { action: 'stock_adjusted', item: updated });
    res.json(updated);
  } catch (error: any) {
    console.error('Failed to adjust stock:', error);
    res.status(500).json({ error: error.message || 'Failed to adjust stock' });
  }
});

// Delete inventory item
app.delete('/api/items/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid ID' });
    }

    const performedBy = req.user?.email || req.user?.uid || 'Unknown';
    const deleted = await deleteInventoryItem(id, performedBy);

    broadcastUpdate('inventory_updated', { action: 'delete', id });
    res.json({ success: true, deleted });
  } catch (error: any) {
    console.error('Failed to delete item:', error);
    res.status(500).json({ error: error.message || 'Failed to delete item' });
  }
});

// Categories list & creation
app.get('/api/categories', async (_req, res) => {
  try {
    const cats = await getCategories();
    res.json(cats);
  } catch (error: any) {
    console.error('Failed to get categories:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch categories' });
  }
});

app.post('/api/categories', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { name, description, color } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    const cat = await createCategory(name.trim(), description, color);
    broadcastUpdate('category_created', cat);
    res.status(201).json(cat);
  } catch (error: any) {
    console.error('Failed to create category:', error);
    res.status(500).json({ error: error.message || 'Failed to create category' });
  }
});

// Transactions history
app.get('/api/transactions', async (_req, res) => {
  try {
    const txs = await getRecentTransactions(40);
    res.json(txs);
  } catch (error: any) {
    console.error('Failed to get transactions:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch transactions' });
  }
});

// Metrics summary
app.get('/api/metrics', async (_req, res) => {
  try {
    const metrics = await getInventoryMetrics();
    res.json(metrics);
  } catch (error: any) {
    console.error('Failed to get metrics:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch metrics' });
  }
});

// Vite middleware & Static serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
