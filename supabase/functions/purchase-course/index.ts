import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts' // Ensure you have this shared file

// Helper function to create Supabase client with user's auth context
function createAuthedClient(req: Request): SupabaseClient {
  // Implementation identical to the one in previous functions
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
   // Implementation identical to the one in previous functions
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

    // 2. Get course_id and cost from request body
    const { course_id, cost } = await req.json();
    if (!course_id || !cost || typeof cost !== 'number' || cost <= 0) {
        throw new Error("Invalid request body: course_id and positive cost required.");
    }

    // 3. Call the Database Function using Admin Client
    console.log(`User ${userId} attempting to purchase course ${course_id} for cost ${cost}`);
    const supabaseAdmin = createAdminClient();
    const { data: newBalance, error: rpcError } = await supabaseAdmin.rpc('purchase_course_tx', {
        p_user_id: userId,
        p_course_id: String(course_id), // Ensure course_id is text
        p_cost: cost
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
         if (rpcError.message.includes('Course already purchased')) {
             return new Response(JSON.stringify({ error: 'You have already purchased this course.' }), {
               headers: { ...corsHeaders, 'Content-Type': 'application/json' },
               status: 409, // Conflict
             });
        }
        // Otherwise, throw generic error based on RPC message
        throw new Error(rpcError.message || 'Database error during purchase.');
    }

    // 4. Handle Success
    console.log('RPC Success Data (New Balance):', newBalance);
    const responseData = {
      message: `Successfully purchased course: ${course_id}!`,
      newBalance: newBalance // The DB function returns the new balance directly
    }
    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error("Error in purchase-course function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: error.message === 'User not authenticated' ? 401 : (error.message.startsWith("Invalid request body") ? 400 : 500),
    })
  }
})