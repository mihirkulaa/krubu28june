-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
create table users (
  id uuid references auth.users not null primary key,
  tier integer default 1, -- 1: Free, 2: Graduate, 3: Master's, 4: Professional
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table users enable row level security;

-- Create policy for authenticated users to read their own data
create policy "Users can view their own data."
  on users for select
  using ( auth.uid() = id );

-- Create policy for admins to view all data
create policy "Admins can view all data."
  on users for select
  using ( auth.role() = 'service_role' );

-- Create policy for updating own tier
create policy "Users can update their own tier."
  on users for update
  using ( auth.uid() = id )
  with check ( auth.uid() = id );

-- Create chat_history table
create table chat_history (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  policy_description text not null,
  response text not null,
  tier integer not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table chat_history enable row level security;

-- Create policy for authenticated users to read their own chat history
create policy "Users can view their own chat history."
  on chat_history for select
  using ( auth.uid() = user_id );

-- Create policy for inserting own chat history
create policy "Users can insert their own chat history."
  on chat_history for insert
  with check ( auth.uid() = user_id );
