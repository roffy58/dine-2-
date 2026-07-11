import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertOrderSchema } from "../shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Create Order
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

  // Get All Orders
  app.get("/api/orders", async (_req, res) => {
    try {
      const orders = await storage.getOrders();
      res.status(200).json({ success: true, orders });
    } catch (error) {
      console.error("Get orders error:", error);
      res.status(500).json({ success: false, message: "Failed to retrieve orders" });
    }
  });

  // 1. Get Single Order (Polling ke liye)
  app.get("/api/orders/:id", async (req, res) => {
    try {
      const order = await storage.getOrder(parseInt(req.params.id));
      if (!order) return res.status(404).json({ success: false, message: "Order not found" });
      res.status(200).json({ success: true, ...order });
    } catch (error) {
      res.status(500).json({ success: false, message: "Server error" });
    }
  });

  // 2. Update Order Status (Dashboard se confirmation ke liye)
  app.patch("/api/orders/:id", async (req, res) => {
    try {
      const { status } = req.body;
      const order = await storage.updateOrderStatus(parseInt(req.params.id), status);
      res.status(200).json({ success: true, order });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to update order" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
