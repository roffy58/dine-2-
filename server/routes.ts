import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertOrderSchema } from "../shared/schema";
import Stripe from "stripe"; // Stripe import karo

// Stripe initialize karo
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

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

  // Stripe Checkout Session Route
  app.post("/api/create-checkout-session", async (req, res) => {
    // Agar Stripe key nahi hai, toh simulation mode chalao
    if (!stripe) {
      console.warn("Stripe key missing, using simulation mode.");
      return res.json({ sessionId: "mock_session_id_for_testing" });
    }

    try {
      const { items, total } = req.body;
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'inr',
            product_data: { name: 'Restaurant Order' },
            unit_amount: Math.round(parseFloat(total) * 100),
          },
          quantity: 1,
        }],
        mode: 'payment',
        success_url: `${req.headers.origin}/`, // Success ke baad home pe bhej do
        cancel_url: `${req.headers.origin}/`,
      });

      res.json({ sessionId: session.id });
    } catch (error) {
      console.error("Stripe session error:", error);
      res.status(500).json({ success: false, message: "Stripe error" });
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

  // Get Single Order
  app.get("/api/orders/:id", async (req, res) => {
    try {
      const order = await storage.getOrder(parseInt(req.params.id));
      if (!order) return res.status(404).json({ success: false, message: "Order not found" });
      res.status(200).json({ success: true, ...order });
    } catch (error) {
      res.status(500).json({ success: false, message: "Server error" });
    }
  });

  // Update Order Status
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
