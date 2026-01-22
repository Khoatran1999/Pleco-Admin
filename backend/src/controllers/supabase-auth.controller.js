/**
 * Supabase Authentication Controller
 * Handles user authentication using Supabase Auth
 */

const supabase = require('../config/supabase');

/**
 * Sign up new user
 */
async function signUp(req, res) {
  try {
    const { email, password, full_name, username } = req.body;

    // Validate input
    if (!email || !password || !full_name || !username) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, full_name, and username are required',
      });
    }

    // Check if username already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .single();

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Username already exists',
      });
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name,
          username,
        },
        emailRedirectTo: undefined, // Disable email confirmation in development
      },
    });

    if (authError) {
      return res.status(400).json({
        success: false,
        message: authError.message,
      });
    }

    // Auto-confirm email in development (if service role key is available)
    if (process.env.NODE_ENV === 'development' && authData.user) {
      try {
        await supabase.auth.admin.updateUserById(authData.user.id, {
          email_confirm: true,
        });
      } catch (confirmError) {
        console.warn('Could not auto-confirm email:', confirmError.message);
      }
    }

    // Get default staff role
    const { data: staffRole } = await supabase
      .from('roles')
      .select('id')
      .eq('name', 'staff')
      .single();

    // Create user record in database
    const { data: userData, error: dbError } = await supabase
      .from('users')
      .insert({
        username,
        email,
        full_name,
        role_id: staffRole?.id || 3,
        password: 'managed_by_supabase_auth', // Placeholder
      })
      .select()
      .single();

    if (dbError) {
      // Rollback: delete auth user if db insert fails
      await supabase.auth.admin.deleteUser(authData.user.id);

      return res.status(500).json({
        success: false,
        message: 'Failed to create user record',
      });
    }

    res.status(201).json({
      success: true,
      message: 'User created successfully. Please check your email for verification.',
      data: {
        user: {
          id: userData.id,
          username: userData.username,
          email: userData.email,
          full_name: userData.full_name,
        },
      },
    });
  } catch (error) {
    console.error('Sign up error:', error);
    res.status(500).json({
      success: false,
      message: 'Sign up failed',
    });
  }
}

/**
 * Sign in user
 */
async function signIn(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    // Sign in with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return res.status(401).json({
        success: false,
        message: error.message,
      });
    }

    // Get user details from database
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select(
        `
        id,
        username,
        email,
        full_name,
        is_active,
        roles (
          id,
          name,
          description
        )
      `,
      )
      .eq('email', email)
      .single();

    if (userError || !userData) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (!userData.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated',
      });
    }

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: userData.id,
        username: userData.username,
        email: userData.email,
        full_name: userData.full_name,
        role_name: userData.roles?.name || 'staff',
        role_id: userData.roles?.id,
      },
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
      },
    });
  } catch (error) {
    console.error('Sign in error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
    });
  }
}

/**
 * Sign out user
 */
async function signOut(req, res) {
  try {
    // Supabase handles session invalidation automatically
    // Just confirm success
    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('Sign out error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed',
    });
  }
}

/**
 * Get current user profile
 */
async function getProfile(req, res) {
  try {
    const { data: userData, error } = await supabase
      .from('users')
      .select(
        `
        id,
        username,
        email,
        full_name,
        is_active,
        created_at,
        roles (
          id,
          name,
          description
        )
      `,
      )
      .eq('id', req.user.id)
      .single();

    if (error) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      data: userData,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
    });
  }
}

/**
 * Request password reset
 */
async function resetPassword(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
      });
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.FRONTEND_URL}/reset-password`,
    });

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.json({
      success: true,
      message: 'Password reset email sent',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send reset email',
    });
  }
}

/**
 * Update password
 */
async function updatePassword(req, res) {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'New password is required',
      });
    }

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update password',
    });
  }
}

/**
 * Refresh access token
 */
async function refreshToken(req, res) {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required',
      });
    }

    const { data, error } = await supabase.auth.refreshSession({
      refresh_token,
    });

    if (error) {
      return res.status(401).json({
        success: false,
        message: error.message,
      });
    }

    res.json({
      success: true,
      data: {
        session: {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_at: data.session.expires_at,
        },
      },
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to refresh token',
    });
  }
}

module.exports = {
  signUp,
  signIn,
  signOut,
  getProfile,
  resetPassword,
  updatePassword,
  refreshToken,
};
