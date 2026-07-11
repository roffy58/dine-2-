import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertOrderSchema } from "../shared/schema"; 

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/orders", async (req, res) => {
    try {
      const validatedOrder = insertOrderSchema.parse(req.body);
      const order = await storage.createOrder(validatedOrder);
      res.status(201).json({ success: true, order });
    } catch (error) {
      console.error("Order creation error:", error);
      res.status(400).json({ success: false, message: "Invalid order data" });
    }
  });

  app.get("/api/orders", async (_req, res) => {
    try {
      const orders = await storage.getOrders();
      res.status(200).json({ success: true, orders });
    } catch (error) {
      console.error("Get orders error:", error);
      res.status(500).json({ success: false, message: "Failed to retrieve orders" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
