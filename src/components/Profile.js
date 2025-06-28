import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Paper, Typography, Button, Container, TextField } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

const Profile = () => {
  const navigate = useNavigate();
  const { user, updateProfile } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    bio: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email,
        bio: user.bio || '',
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateProfile(formData);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%', maxWidth: '400px' }}>
          <Typography component="h1" variant="h5" align="center" gutterBottom>
            Profile
          </Typography>
          
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              fullWidth
              id="name"
              label="Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
            />
            <TextField
              margin="normal"
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              disabled
            />
            <TextField
              margin="normal"
              fullWidth
              id="bio"
              label="Bio"
              name="bio"
              multiline
              rows={4}
              value={formData.bio}
              onChange={handleChange}
            />
            {error && <Typography color="error" sx={{ mt: 1 }}>{error}</Typography>}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
            >
              Update Profile
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Profile;
