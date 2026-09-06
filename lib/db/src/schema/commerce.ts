import { date, integer, jsonb, numeric, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const purchasesTable = pgTable("purchases", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  userEmail: text("user_email"),
  userName: text("user_name"),
  itemId: text("item_id").notNull(),
  itemTitleAr: text("item_title_ar").notNull(),
  itemTitleEn: text("item_title_en").notNull(),
  itemKind: text("item_kind").notNull(),
  quantity: integer("quantity").notNull().default(1),
  paidJod: numeric("paid_jod", { precision: 12, scale: 2 }).notNull(),
  paypalOrderId: text("paypal_order_id").notNull(),
  paypalCaptureId: text("paypal_capture_id"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("purchases_order_item_unique").on(table.paypalOrderId, table.itemId),
]);

export const bookingsTable = pgTable("bookings", {
  id: uuid("id").primaryKey().defaultRandom(),
  purchaseId: uuid("purchase_id"),
  itemId: text("item_id").notNull(),
  itemTitleAr: text("item_title_ar").notNull(),
  itemTitleEn: text("item_title_en").notNull(),
  buyerUid: text("buyer_uid").notNull(),
  buyerEmail: text("buyer_email"),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  whatsappCountryCode: text("whatsapp_country_code").notNull(),
  whatsappNumber: text("whatsapp_number").notNull(),
  sessionDate: date("session_date", { mode: "string" }),
  sessionTime: text("session_time"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const paymentOrdersTable = pgTable("payment_orders", {
  orderId: text("order_id").primaryKey(),
  userId: text("user_id").notNull(),
  cart: jsonb("cart").$type<Array<{
    itemId: string;
    titleAr: string;
    titleEn: string;
    kind: string;
    priceJod: number;
    quantity: number;
  }>>().notNull(),
  status: text("status").notNull().default("created"),
  captureId: text("capture_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  capturedAt: timestamp("captured_at", { withTimezone: true }),
});

export const insertPurchaseSchema = createInsertSchema(purchasesTable).omit({ id: true, createdAt: true });
export const insertBookingSchema = createInsertSchema(bookingsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type Purchase = typeof purchasesTable.$inferSelect;
export type Booking = typeof bookingsTable.$inferSelect;
export type InsertPurchase = z.infer<typeof insertPurchaseSchema>;
export type InsertBooking = z.infer<typeof insertBookingSchema>;