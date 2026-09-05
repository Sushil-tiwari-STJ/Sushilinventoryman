import { integer, numeric, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

// Users table authenticated via Firebase Auth
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  displayName: text('display_name'),
  role: text('role').default('Manager').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Inventory Categories
export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  description: text('description'),
  color: text('color').default('#3b82f6'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Inventory Items table
export const inventoryItems = pgTable('inventory_items', {
  id: serial('id').primaryKey(),
  sku: text('sku').notNull().unique(),
  name: text('name').notNull(),
  category: text('category').notNull().default('General'),
  description: text('description'),
  quantity: integer('quantity').notNull().default(0),
  minThreshold: integer('min_threshold').notNull().default(5),
  unitPrice: numeric('unit_price', { precision: 10, scale: 2 }).notNull().default('0.00'),
  gstRate: numeric('gst_rate', { precision: 5, scale: 2 }).notNull().default('18.00'),
  hsnCode: text('hsn_code'),
  location: text('location').default('Shelf A-1'),
  supplier: text('supplier'),
  lastUpdatedBy: text('last_updated_by'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Inventory stock transactions audit log
export const stockTransactions = pgTable('stock_transactions', {
  id: serial('id').primaryKey(),
  itemId: integer('item_id').references(() => inventoryItems.id, { onDelete: 'cascade' }),
  itemSku: text('item_sku').notNull(),
  itemName: text('item_name').notNull(),
  type: text('type').notNull(), // 'RESTOCK' | 'DISPATCH' | 'ADJUSTMENT' | 'INITIAL'
  quantityChange: integer('quantity_change').notNull(),
  previousQuantity: integer('previous_quantity').notNull(),
  newQuantity: integer('new_quantity').notNull(),
  notes: text('notes'),
  performedBy: text('performed_by').notNull(),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
});
