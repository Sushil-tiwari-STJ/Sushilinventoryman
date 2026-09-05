import { desc, eq, ilike, or, sql } from 'drizzle-orm';
import { db } from './index.ts';
import { categories, inventoryItems, stockTransactions, users } from './schema.ts';

// User registration / upsert
export async function getOrCreateUser(uid: string, email: string, displayName?: string) {
  try {
    const result = await db
      .insert(users)
      .values({
        uid,
        email,
        displayName: displayName || email.split('@')[0],
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email,
          displayName: displayName || email.split('@')[0],
        },
      })
      .returning();
    return result[0];
  } catch (error) {
    console.error('Database query getOrCreateUser failed:', error);
    throw new Error('Database operation failed', { cause: error });
  }
}

// Get all inventory items with optional search & filter
export async function getInventoryItems(search?: string, category?: string) {
  try {
    let query = db.select().from(inventoryItems);

    if (search && category && category !== 'All') {
      const searchPattern = `%${search}%`;
      return await query
        .where(
          sql`(${ilike(inventoryItems.name, searchPattern)} OR ${ilike(inventoryItems.sku, searchPattern)} OR ${ilike(inventoryItems.description, searchPattern)}) AND ${eq(inventoryItems.category, category)}`
        )
        .orderBy(desc(inventoryItems.updatedAt));
    } else if (search) {
      const searchPattern = `%${search}%`;
      return await query
        .where(
          or(
            ilike(inventoryItems.name, searchPattern),
            ilike(inventoryItems.sku, searchPattern),
            ilike(inventoryItems.description, searchPattern)
          )
        )
        .orderBy(desc(inventoryItems.updatedAt));
    } else if (category && category !== 'All') {
      return await query
        .where(eq(inventoryItems.category, category))
        .orderBy(desc(inventoryItems.updatedAt));
    }

    return await query.orderBy(desc(inventoryItems.updatedAt));
  } catch (error) {
    console.error('Database query getInventoryItems failed:', error);
    throw new Error('Database query failed', { cause: error });
  }
}

// Create new inventory item
export async function createInventoryItem(data: {
  sku: string;
  name: string;
  category: string;
  description?: string;
  quantity: number;
  minThreshold: number;
  unitPrice: string;
  gstRate?: string;
  hsnCode?: string;
  location?: string;
  supplier?: string;
  performedBy: string;
}) {
  try {
    const insertedItems = await db
      .insert(inventoryItems)
      .values({
        sku: data.sku,
        name: data.name,
        category: data.category || 'General',
        description: data.description || '',
        quantity: data.quantity,
        minThreshold: data.minThreshold || 5,
        unitPrice: data.unitPrice || '0.00',
        gstRate: data.gstRate || '18.00',
        hsnCode: data.hsnCode || null,
        location: data.location || 'Bengaluru DC - Bay B2',
        supplier: data.supplier || '',
        lastUpdatedBy: data.performedBy,
        updatedAt: new Date(),
      })
      .returning();

    const newItem = insertedItems[0];

    // Log transaction
    await db.insert(stockTransactions).values({
      itemId: newItem.id,
      itemSku: newItem.sku,
      itemName: newItem.name,
      type: 'INITIAL',
      quantityChange: data.quantity,
      previousQuantity: 0,
      newQuantity: data.quantity,
      notes: 'Initial product registered (India Inventory)',
      performedBy: data.performedBy,
    });

    return newItem;
  } catch (error) {
    console.error('Database query createInventoryItem failed:', error);
    throw new Error('Failed to create inventory item', { cause: error });
  }
}

// Update inventory item details
export async function updateInventoryItem(
  id: number,
  data: {
    sku?: string;
    name?: string;
    category?: string;
    description?: string;
    minThreshold?: number;
    unitPrice?: string;
    gstRate?: string;
    hsnCode?: string;
    location?: string;
    supplier?: string;
    performedBy: string;
  }
) {
  try {
    const updated = await db
      .update(inventoryItems)
      .set({
        ...(data.sku ? { sku: data.sku } : {}),
        ...(data.name ? { name: data.name } : {}),
        ...(data.category ? { category: data.category } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.minThreshold !== undefined ? { minThreshold: data.minThreshold } : {}),
        ...(data.unitPrice !== undefined ? { unitPrice: data.unitPrice } : {}),
        ...(data.gstRate !== undefined ? { gstRate: data.gstRate } : {}),
        ...(data.hsnCode !== undefined ? { hsnCode: data.hsnCode } : {}),
        ...(data.location !== undefined ? { location: data.location } : {}),
        ...(data.supplier !== undefined ? { supplier: data.supplier } : {}),
        lastUpdatedBy: data.performedBy,
        updatedAt: new Date(),
      })
      .where(eq(inventoryItems.id, id))
      .returning();

    return updated[0];
  } catch (error) {
    console.error('Database query updateInventoryItem failed:', error);
    throw new Error('Failed to update inventory item', { cause: error });
  }
}

// Adjust stock (Restock, Dispatch, Adjustment)
export async function adjustItemStock(
  id: number,
  quantityChange: number,
  type: 'RESTOCK' | 'DISPATCH' | 'ADJUSTMENT',
  notes: string,
  performedBy: string
) {
  try {
    const existing = await db
      .select()
      .from(inventoryItems)
      .where(eq(inventoryItems.id, id));

    if (!existing.length) {
      throw new Error('Item not found');
    }

    const item = existing[0];
    const prevQty = item.quantity;
    const newQty = Math.max(0, prevQty + quantityChange);

    const updated = await db
      .update(inventoryItems)
      .set({
        quantity: newQty,
        lastUpdatedBy: performedBy,
        updatedAt: new Date(),
      })
      .where(eq(inventoryItems.id, id))
      .returning();

    // Log transaction
    await db.insert(stockTransactions).values({
      itemId: item.id,
      itemSku: item.sku,
      itemName: item.name,
      type,
      quantityChange,
      previousQuantity: prevQty,
      newQuantity: newQty,
      notes: notes || `Stock ${type.toLowerCase()} of ${quantityChange}`,
      performedBy,
    });

    return updated[0];
  } catch (error) {
    console.error('Database query adjustItemStock failed:', error);
    throw new Error('Failed to adjust stock', { cause: error });
  }
}

// Delete inventory item
export async function deleteInventoryItem(id: number, performedBy: string) {
  try {
    const existing = await db
      .select()
      .from(inventoryItems)
      .where(eq(inventoryItems.id, id));

    if (existing.length > 0) {
      const item = existing[0];
      await db.insert(stockTransactions).values({
        itemId: null,
        itemSku: item.sku,
        itemName: item.name,
        type: 'ADJUSTMENT',
        quantityChange: -item.quantity,
        previousQuantity: item.quantity,
        newQuantity: 0,
        notes: `Item deleted: ${item.name} (${item.sku})`,
        performedBy,
      });
    }

    const deleted = await db
      .delete(inventoryItems)
      .where(eq(inventoryItems.id, id))
      .returning();

    return deleted[0];
  } catch (error) {
    console.error('Database query deleteInventoryItem failed:', error);
    throw new Error('Failed to delete item', { cause: error });
  }
}

// Categories
export async function getCategories() {
  try {
    return await db.select().from(categories).orderBy(categories.name);
  } catch (error) {
    console.error('Database query getCategories failed:', error);
    throw new Error('Failed to fetch categories', { cause: error });
  }
}

export async function createCategory(name: string, description?: string, color?: string) {
  try {
    const created = await db
      .insert(categories)
      .values({
        name,
        description: description || '',
        color: color || '#3b82f6',
      })
      .onConflictDoNothing()
      .returning();
    return created[0];
  } catch (error) {
    console.error('Database query createCategory failed:', error);
    throw new Error('Failed to create category', { cause: error });
  }
}

// Stock transactions / Audit log
export async function getRecentTransactions(limit = 30) {
  try {
    return await db
      .select()
      .from(stockTransactions)
      .orderBy(desc(stockTransactions.timestamp))
      .limit(limit);
  } catch (error) {
    console.error('Database query getRecentTransactions failed:', error);
    throw new Error('Failed to fetch transactions', { cause: error });
  }
}

// Aggregated inventory statistics
export async function getInventoryMetrics() {
  try {
    const all = await db.select().from(inventoryItems);
    const totalItems = all.length;
    let totalQuantity = 0;
    let totalValue = 0;
    let lowStockCount = 0;

    for (const item of all) {
      totalQuantity += item.quantity;
      const price = parseFloat(item.unitPrice) || 0;
      totalValue += price * item.quantity;
      if (item.quantity <= item.minThreshold) {
        lowStockCount++;
      }
    }

    return {
      totalItems,
      totalQuantity,
      totalValue: totalValue.toFixed(2),
      lowStockCount,
    };
  } catch (error) {
    console.error('Database query getInventoryMetrics failed:', error);
    throw new Error('Failed to fetch inventory metrics', { cause: error });
  }
}
