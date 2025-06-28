import React, { useState, useEffect } from 'react';
import { Box, Paper, Typography, TextField, Button, List, ListItem, ListItemText, Divider } from '@mui/material';
import axios from 'axios';

const Chat = ({ user, supabase, tier }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load chat history when component mounts
    loadChatHistory();
  }, [user]);

  const loadChatHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMessages(data);
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await axios.post('http://localhost:8000/api/simulate', {
        policyDescription: input,
        tier: tier
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.error) {
        throw new Error(response.data.error);
      }

      // Add new message to chat history
      setMessages(prev => [
        ...prev,
        {
          policy_description: input,
          response: response.data.response,
          tier: tier,
          created_at: new Date()
        }
      ]);
      setInput('');
      loadChatHistory(); // Refresh chat history after successful submission
    } catch (error) {
      console.error('Error:', error);
      alert(error.response?.data?.error || 'Failed to process policy simulation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Chat History Sidebar */}
        <Box sx={{ width: 300, borderRight: 1, borderColor: 'divider', overflowY: 'auto' }}>
          <Typography variant="h6" sx={{ p: 2 }}>
            Chat History
          </Typography>
          <List>
            {messages.map((message, index) => (
              <React.Fragment key={message.id}>
                <ListItem>
                  <ListItemText
                    primary={message.policy_description}
                    secondary={message.response}
                  />
                </ListItem>
                {index < messages.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </Box>

        {/* Chat Interface */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ p: 3, flex: 1, overflowY: 'auto' }}>
            <Typography variant="h4" component="h1" gutterBottom>
              Policy Impact Simulator
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Enter a policy description to analyze its potential impact.
            </Typography>
          </Box>

          <Box sx={{ p: 3, borderTop: 1, borderColor: 'divider' }}>
            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Enter policy description"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                variant="outlined"
                multiline
                rows={4}
                disabled={loading}
              />
              <Button
                type="submit"
                variant="contained"
                color="primary"
                sx={{ mt: 2 }}
                disabled={loading || !input.trim()}
              >
                {loading ? 'Analyzing...' : 'Analyze Policy'}
              </Button>
            </form>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Chat;
