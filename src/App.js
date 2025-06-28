import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { supabase } from './supabaseClient';

// Components
import Navbar from './components/Navbar';
import Chat from './components/Chat';
import Login from './components/Login';
import Signup from './components/Signup';
import Profile from './components/Profile';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  const [user, setUser] = useState(null);
  const [tier, setTier] = useState(1);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const user = session?.user;
      setUser(user ?? null);
      
      if (user) {
        try {
          // First try to get user's tier
          const { data: userData, error: tierError } = await supabase
            .from('users')
            .select('tier')
            .eq('id', user.id)
            .single();

          if (tierError) {
            // If user doesn't exist, create them with default tier
            const { error: createError } = await supabase
              .from('users')
              .insert([{ id: user.id, tier: 1 }])
              .select('tier')
              .single();

            if (createError) {
              console.error('Error creating user record:', createError);
              setTier(1);
            } else {
              setTier(1);
            }
          } else {
            setTier(userData.tier || 1);
          }
        } catch (error) {
          console.error('Error handling user tier:', error);
          setTier(1); // Default to tier 1 on any error
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const handleLogin = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
    setUser(data.user);
  };

  const handleSignup = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    
    if (error) throw error;
    setUser(data.user);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const handleTierChange = async (newTier) => {
    if (user) {
      const { error } = await supabase
        .from('users')
        .update({ tier: newTier })
        .eq('id', user.id);
      
      if (error) throw error;
      setTier(newTier);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Navbar user={user} onLogout={handleLogout} tier={tier} onTierChange={handleTierChange} />
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" /> : <Login onLogin={handleLogin} />} />
        <Route path="/signup" element={user ? <Navigate to="/" /> : <Signup onSignup={handleSignup} />} />
        <Route path="/profile" element={user ? <Profile user={user} supabase={supabase} /> : <Navigate to="/login" />} />
        <Route path="/" element={user ? <Chat user={user} supabase={supabase} tier={tier} /> : <Navigate to="/login" />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </ThemeProvider>
  );
}

export default App;
