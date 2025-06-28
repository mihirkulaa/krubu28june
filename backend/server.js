require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js'); // Update the Supabase import to use the correct package name
const OpenAI = require('openai');

const app = express();
const port = process.env.PORT || 8000;

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRod290dG1yY2l0a2Jkd2tyanlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEwOTU0MjIsImV4cCI6MjA2NjY3MTQyMn0.dbo2XFuA_Q0sdkFdx8Sl433LEHPay2QNts5wv6WaCUI';
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize OpenAI client
const openaiApiKey = process.env.OPENAI_API_KEY;
if (!openaiApiKey) {
  console.error('OpenAI API key is not configured in environment variables');
  process.exit(1);
}

// Initialize OpenAI client with proper configuration
const openai = new OpenAI({
  apiKey: openaiApiKey,
  baseURL: 'https://api.openai.com/v1' // Explicitly set the base URL
});

app.use(cors());
app.use(express.json());

// Middleware to verify authentication
const verifyAuth = async (req, res, next) => {
  const { authorization } = req.headers;
  if (!authorization) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  // Handle both Bearer and plain token formats
  const token = authorization.startsWith('Bearer ')
    ? authorization.split(' ')[1]
    : authorization;

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      console.error('Auth error:', error);
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Get user tier
const getUserTier = async (userId) => {
  const { data, error } = await supabase
    .from('users')
    .select('tier')
    .eq('id', userId)
    .single();
  
  if (error) throw error;
  return data.tier;
};

// Policy simulation endpoint
app.post('/api/simulate', verifyAuth, async (req, res) => {
  try {
    const { policyDescription, tier: requestedTier } = req.body;
    
    // Validate input
    if (!policyDescription || typeof policyDescription !== 'string') {
      return res.status(400).json({ error: 'Invalid policy description' });
    }

    // Get user's actual tier from database
    const userTier = await getUserTier(req.user.id);
    
    // Validate tier
    if (typeof requestedTier !== 'number' || requestedTier < 1 || requestedTier > 4) {
      return res.status(400).json({ error: 'Invalid tier requested' });
    }

    // Ensure user's tier is sufficient
    if (requestedTier > userTier) {
      return res.status(403).json({ 
        error: 'Insufficient tier to use this analysis level. Please upgrade your account.' 
      });
    }

    // Define prompts based on tier
    const prompts = {
      1: `Analyze the impact of this policy: ${policyDescription}. Provide a basic analysis focusing on immediate effects.`,
      2: `Analyze the impact of this policy: ${policyDescription}. Provide a graduate-level analysis including short-term and medium-term effects, and potential challenges.`,
      3: `Analyze the impact of this policy: ${policyDescription}. Provide a master's level analysis including comprehensive short-term, medium-term, and long-term effects, potential challenges, and implementation strategies.`,
      4: `Analyze the impact of this policy: ${policyDescription}. Provide a professional/PhD-level analysis including comprehensive short-term, medium-term, and long-term effects, potential challenges, implementation strategies, and policy recommendations. Include relevant data and case studies if possible. `
    };

    // Choose model based on tier
    const models = {
      1: 'gpt-3.5-turbo',
      2: 'gpt-3.5-turbo',
      3: 'gpt-4',
      4: 'gpt-4'
    };

    const prompt = prompts[requestedTier];
    const model = models[requestedTier];

    if (!prompt || !model) {
      return res.status(400).json({ error: 'Invalid user tier' });
    }

    try {
      const completion = await openai.chat.completions.create({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7
      });

      // Save chat history
      await supabase.from('chat_history').insert([
        {
          user_id: req.user.id,
          policy_description: policyDescription,
          response: completion.choices[0].message.content,
          tier: requestedTier,
          created_at: new Date().toISOString()
        }
      ]);

      res.json({
        success: true,
        response: completion.choices[0].message.content
      });
    } catch (error) {
      console.error('OpenAI API error:', error);
      res.status(500).json({
        error: 'Failed to process policy simulation. Please try again later.'
      });
    }
  } catch (error) {
    console.error('Error processing policy simulation:', error);
    res.status(500).json({
      error: error.message || 'Failed to process policy simulation. Please try again later.'
    });
  }
});

// Get chat history
app.get('/api/history', verifyAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('chat_history')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
