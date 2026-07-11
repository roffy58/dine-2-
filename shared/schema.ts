import { sql } from "drizzle-orm";
import { pgTable, text, jsonb, timestamp, serial, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  table_no: text("table_no").notNull(),
  customer_name: text("customer_name").notNull(),
  items: jsonb("items").notNull(),
  total: numeric("total").notNull(),
  notes: text("notes"),
  paymentType: text("payment_type").notNull().default("card"),
  paymentStatus: text("payment_status").notNull().default("pending"),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const orderItemSchema = z.object({
  name: z.string(),
  qty: z.number().int().positive(),
  price: z.number().positive(),
  total: z.number().positive().optional(),
});

// Ye raha aapka robust schema
export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
