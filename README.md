# Policy Impact Simulator

A web application that simulates the impact of government policies using AI.

## Features

- Policy impact simulation using OpenAI's GPT models
- User authentication with Supabase
- Chat history persistence
- Tier-based analysis (Free, Graduate, Master's, Professional)
- Modern React frontend with Material-UI

## Setup Instructions

1. Install dependencies:
```bash
# Frontend
npm install

# Backend
cd backend
npm install
```

2. Create a `.env` file in the root directory and add your configuration:
```env
# Backend
PORT=5000
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
OPENAI_API_KEY=your_openai_api_key

# Frontend (in frontend/.env)
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. Create Supabase database tables:
```sql
-- Create users table
create table users (
  id uuid references auth.users not null primary key,
  tier integer default 1, -- 1: Free, 2: Graduate, 3: Master's, 4: Professional
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create chat_history table
create table chat_history (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  policy_description text not null,
  response text not null,
  tier integer not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
```

4. Start the backend server:
```bash
cd backend
npm run dev
```

5. Start the frontend:
```bash
npm start
```

## Usage

1. Sign up or log in to the application
2. Select your analysis tier from the dropdown menu
3. Enter a policy description in the chat interface
4. View the analysis and chat history on the left sidebar

## Tier Descriptions

1. **Free Tier**: Basic analysis using GPT-3.5
2. **Graduate Tier**: Graduate-level analysis using GPT-3.5
3. **Master's Tier**: Comprehensive analysis using GPT-4
4. **Professional Tier**: Professional-level analysis using GPT-4
