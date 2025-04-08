import express from 'express';
import cors from 'cors';
import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// Check if the Stripe API key is available
const stripeApiKey = process.env.VITE_STRIPE_SECRET_KEY;
if (!stripeApiKey) {
  console.error('Stripe API key is missing. Please check your .env file.');
  process.exit(1);
}

// Initialize Stripe with the API key
const stripe = new Stripe(stripeApiKey);

app.use(cors());
app.use(express.json());

app.post('/create-checkout-session', async (req, res) => {
  try {
    // Check if the price ID is available
    const priceId = process.env.VITE_STRIPE_PRICE_ID;
    if (!priceId) {
      console.error('Stripe price ID is missing. Please check your .env file.');
      return res.status(500).json({ error: 'Server configuration error' });
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
      success_url: `${process.env.VITE_APP_URL || 'http://localhost:5173'}/premium-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.VITE_APP_URL || 'http://localhost:5173'}/premium`,
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
}); 