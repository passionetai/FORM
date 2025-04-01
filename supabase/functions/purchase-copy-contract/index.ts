import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts' // Ensure you have this shared file

const CONTRACT_COST = 37;
const CONTRACT_TYPE = 'copy_trading';

// Helper function to create Supabase client with user's auth context
function createAuthedClient(req: Request): SupabaseClient {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
  );
}

// Helper function to create Supabase client with service role (for admin tasks)
function createAdminClient(): SupabaseClient {
   return createClient(
     Deno.env.get('SUPABASE_URL') ?? '',
     Deno.env.get('SERVICE_ROLE_KEY') ?? '', // Use custom secret name
     { auth: { persistSession: false } } // No need to persist session for admin
   );
}


serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createAuthedClient(req); // Client with user context
    const supabaseAdmin = createAdminClient(); // Client with service role for updates

    // Get user details (will throw error if not authenticated)
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) throw new Error("User not authenticated")

    const userId = user.id;

    // --- Transaction Logic ---
    // Use Supabase transaction for atomicity
    const { data, error } = await supabaseAdmin.rpc('purchase_contract_tx', {
        p_user_id: userId,
        p_contract_type: CONTRACT_TYPE,
        p_contract_cost: CONTRACT_COST
    });

    if (error) {
        // Check for specific error messages raised in the function
        if (error.message.includes('Insufficient funds')) {
             return new Response(JSON.stringify({ error: 'Insufficient funds.' }), {
               headers: { ...corsHeaders, 'Content-Type': 'application/json' },
               status: 400, // Bad Request
             });
        }
         if (error.message.includes('Contract already purchased')) {
             return new Response(JSON.stringify({ message: 'Contract already purchased.' }), {
               headers: { ...corsHeaders, 'Content-Type': 'application/json' },
               status: 409, // Conflict
             });
        }
        // Otherwise, throw generic error
        throw error;
    }

    // Success: data should contain the new balance if the function returns it
    const responseData = {
      message: 'Contract purchased successfully!',
      newBalance: data // Assuming the RPC function returns the new balance
    }
    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error("Error in purchase-copy-contract function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500, // Internal Server Error for unexpected issues
    })
  }
})

/* IMPORTANT: You also need to create the PostgreSQL function `purchase_contract_tx`
   that this Edge Function calls. Run the following SQL in your Supabase SQL Editor:

CREATE OR REPLACE FUNCTION purchase_contract_tx(
    p_user_id uuid,
    p_contract_type text,
    p_contract_cost numeric
)
RETURNS numeric -- Returns the new balance
LANGUAGE plpgsql
SECURITY DEFINER -- Allows it to update tables even with user RLS
AS $$
DECLARE
  v_current_balance numeric;
  v_new_balance numeric;
  v_already_purchased boolean;
BEGIN
  -- Check if user already purchased this contract type
  SELECT EXISTS (
    SELECT 1 FROM public.user_contracts
    WHERE user_id = p_user_id AND contract_type = p_contract_type
  ) INTO v_already_purchased;

  IF v_already_purchased THEN
    RAISE EXCEPTION 'Contract already purchased';
  END IF;

  -- Get current balance (lock the row for update)
  SELECT balance INTO v_current_balance
  FROM public.profiles
  WHERE id = p_user_id
  FOR UPDATE; -- Lock the row to prevent race conditions

  IF v_current_balance IS NULL THEN
     RAISE EXCEPTION 'Profile not found for user %', p_user_id;
  END IF;

  -- Check funds
  IF v_current_balance < p_contract_cost THEN
    RAISE EXCEPTION 'Insufficient funds';
  END IF;

  -- Deduct cost
  v_new_balance := v_current_balance - p_contract_cost;
  UPDATE public.profiles
  SET balance = v_new_balance
  WHERE id = p_user_id;

  -- Record purchase
  INSERT INTO public.user_contracts (user_id, contract_type, cost)
  VALUES (p_user_id, p_contract_type, p_contract_cost);

  -- Return the new balance
  RETURN v_new_balance;

EXCEPTION
  WHEN OTHERS THEN
    -- Log the error if needed
    RAISE; -- Re-raise the original error
END;
$$;

*/