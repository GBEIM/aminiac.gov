// Cloudflare Worker for Aminoac Government Message Board
// This worker handles message storage and retrieval using Cloudflare D1

export default {
  async fetch(request, env) {
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    
    // Route handling
    if (url.pathname === '/api/messages') {
      if (request.method === 'GET') {
        return handleGetMessages(env, corsHeaders);
      } else if (request.method === 'POST') {
        return handlePostMessage(request, env, corsHeaders);
      }
    }

    return new Response('Not Found', { status: 404 });
  }
};

// Get recent messages from the database
async function handleGetMessages(env, corsHeaders) {
  try {
    // Query the latest 20 messages, ordered by newest first
    const { results } = await env.User_Aminoac.prepare(
      'SELECT id, name, email, message, created_at FROM messages ORDER BY created_at DESC LIMIT 20'
    ).all();

    return new Response(JSON.stringify({ messages: results }), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to fetch messages', details: error.message }), 
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
}

// Post a new message to the database
async function handlePostMessage(request, env, corsHeaders) {
  try {
    const { name, email, message } = await request.json();

    // Validate input
    if (!name || !email || !message) {
      return new Response(
        JSON.stringify({ error: 'Name, email, and message are required' }), 
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }), 
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }

    // Insert message into database
    const result = await env.User_Aminoac.prepare(
      'INSERT INTO messages (name, email, message, created_at) VALUES (?, ?, ?, ?)'
    ).bind(name, email, message, new Date().toISOString()).run();

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Message submitted successfully',
        id: result.meta.last_row_id 
      }), 
      {
        status: 201,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to submit message', details: error.message }), 
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
}