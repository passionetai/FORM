import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

// Helper function to create Supabase client with user's auth context
function createAuthedClient(req: Request): SupabaseClient {
  // Implementation identical to the one in purchase-copy-contract function
  // Ensure Authorization header is passed correctly
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
      throw new Error("Missing Authorization header");
  }
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } }
  );
}

// Helper function to create Supabase client with service role
function createAdminClient(): SupabaseClient {
   // Implementation identical to the one in purchase-copy-contract function
   return createClient(
     Deno.env.get('SUPABASE_URL') ?? '',
     Deno.env.get('SERVICE_ROLE_KEY') ?? '', // Use custom secret name set earlier
     { auth: { persistSession: false } }
   );
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Get User Authentication Context
    const supabaseClient = createAuthedClient(req);
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) throw new Error("User not authenticated");
    const userId = user.id;

    // 2. Get tier and cost from request body
    const { tier, cost } = await req.json();
    if (!tier || !cost || typeof cost !== 'number' || cost <= 0) {
        throw new Error("Invalid request body: tier and positive cost required.");
    }
    // Optional: Add server-side validation for cost based on tier if needed

    // 3. Call the Database Function using Admin Client
    console.log(`User ${userId} attempting to subscribe to tier ${tier} for cost ${cost}`);
    const supabaseAdmin = createAdminClient();
    const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc('subscribe_signals_tx', {
        p_user_id: userId,
        p_tier: String(tier), // Ensure tier is passed as text
        p_cost: cost // Correct parameter name for cost
    });

    if (rpcError) {
        console.error('RPC Error:', rpcError);
        // Check for specific errors raised in the DB function
        if (rpcError.message.includes('Insufficient funds')) {
             return new Response(JSON.stringify({ error: 'Insufficient funds.' }), {
               headers: { ...corsHeaders, 'Content-Type': 'application/json' },
               status: 400, // Bad Request
             });
        }
         if (rpcError.message.includes('User already has an active subscription')) {
             return new Response(JSON.stringify({ error: 'You already have an active subscription.' }), {
               headers: { ...corsHeaders, 'Content-Type': 'application/json' },
               status: 409, // Conflict
             });
        }
        // Otherwise, throw generic error based on RPC message
        throw new Error(rpcError.message || 'Database error during subscription.');
    }

    // 4. Handle Success
    console.log('RPC Success Data:', rpcData);
    // The rpcData from the function is an array containing an object like [{ new_balance: ..., new_expiry_date: ... }]
    const result = rpcData && Array.isArray(rpcData) && rpcData.length > 0 ? rpcData[0] : {};

    const responseData = {
      message: `Successfully subscribed to ${tier}-Day Access!`,
      newBalance: result.new_balance,
      newExpiryDate: result.new_expiry_date
    }
    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error("Error in subscribe-trading-signals function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: error.message === 'User not authenticated' ? 401 : (error.message.startsWith("Invalid request body") ? 400 : 500),
    })
  }
})