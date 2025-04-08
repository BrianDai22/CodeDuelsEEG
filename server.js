import express from 'express';
import cors from 'cors';
import Stripe from 'stripe';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express();
const port = 3000;

// Enable CORS
app.use(cors());
app.use(express.json());

// Initialize Stripe
const stripe = new Stripe(process.env.VITE_STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

// Create checkout session endpoint
app.post('/create-checkout-session', async (req, res) => {
  try {
    const { priceId } = req.body;

    if (!priceId) {
      res.status(400).json({ error: 'Price ID is required' });
      return;
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.VITE_APP_URL}/premium/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.VITE_APP_URL}/premium?canceled=true`,
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      customer_email: req.body.customerEmail,
    });

    res.json({ id: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
}); 