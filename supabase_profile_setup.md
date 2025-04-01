# Plan: Setup Supabase `profiles` Table, RLS, and `avatars` Storage

This plan details the necessary steps within the Supabase dashboard and SQL Editor to enable profile editing features (name, avatar).

**Part 1: `profiles` Table and RLS**

1.  **Create `profiles` Table:**
    *   Navigate: **Table Editor**.
    *   Click **New table**.
    *   Name: `profiles`.
    *   **Disable** RLS initially.
    *   **Columns:**
        *   `id`: `uuid`, Primary Key, Foreign Key to `auth.users.id` (On delete: `Cascade`).
        *   `created_at`: `timestamptz`, Default: `now()`.
        *   `updated_at`: `timestamptz`, Default: `now()`.
        *   `first_name`: `text`, Allow NULL.
        *   `last_name`: `text`, Allow NULL.
        *   `avatar_url`: `text`, Allow NULL.
    *   Click **Save**.
2.  **Create `updated_at` Trigger Function (if needed):**
    *   Navigate: **SQL Editor**.
    *   Run SQL:
        ```sql
        -- Function to update the updated_at column automatically
        CREATE OR REPLACE FUNCTION public.handle_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = now();
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
        ```
3.  **Create `updated_at` Trigger:**
    *   Navigate: **Database** -> **Triggers**.
    *   Click **Create a new trigger**.
    *   Name: `handle_profile_updated_at`
    *   Table: `profiles`
    *   Events: `UPDATE`
    *   Trigger Type: `BEFORE`
    *   Orientation: `ROW`
    *   Function: `handle_updated_at` (or `moddatetime` if available, with `updated_at` as argument).
    *   Click **Confirm**.
4.  **Enable RLS and Create Policies:**
    *   Navigate: **Table Editor** -> select `profiles` -> Enable RLS.
    *   Navigate: **Authentication** -> **Policies** -> select `profiles` table.
    *   **SELECT Policy:**
        *   Name: `Allow authenticated read access`
        *   Operation: `SELECT`
        *   Target roles: `authenticated`
        *   USING expression: `auth.uid() = id`
        *   Save.
    *   **INSERT Policy:** (Optional)
        *   Name: `Allow individual insert access`
        *   Operation: `INSERT`
        *   Target roles: `authenticated`
        *   WITH CHECK expression: `auth.uid() = id`
        *   Save.
    *   **UPDATE Policy:**
        *   Name: `Allow individual update access`
        *   Operation: `UPDATE`
        *   Target roles: `authenticated`
        *   USING expression: `auth.uid() = id`
        *   WITH CHECK expression: `auth.uid() = id`
        *   Save.

**Part 2: `avatars` Storage Bucket and Policies**

1.  **Create Storage Bucket:**
    *   Navigate: **Storage**.
    *   Click **New bucket**.
    *   Name: `avatars`.
    *   Enable **"Make this bucket public"**.
    *   Click **Create bucket**.
2.  **Create Storage Policies (Using SQL Editor):**
    *   Navigate: **SQL Editor**.
    *   Run the following commands one by one:
    *   **SELECT Policy (Public Read):**
        ```sql
        CREATE POLICY "Public read access for avatars bucket"
        ON storage.objects FOR SELECT
        USING ( bucket_id = 'avatars' );
        ```
    *   **INSERT Policy (Authenticated Upload):**
        ```sql
        CREATE POLICY "Allow authenticated users to upload avatars"
        ON storage.objects FOR INSERT
        TO authenticated
        WITH CHECK ( bucket_id = 'avatars' AND auth.uid() = ((storage.foldername(name))[1])::uuid );
        ```
    *   **UPDATE Policy (Authenticated Update):**
        ```sql
        CREATE POLICY "Allow authenticated users to update their own avatars"
        ON storage.objects FOR UPDATE
        TO authenticated
        USING ( bucket_id = 'avatars' AND auth.uid() = ((storage.foldername(name))[1])::uuid )
        WITH CHECK ( bucket_id = 'avatars' AND auth.uid() = ((storage.foldername(name))[1])::uuid );
        ```
    *   **DELETE Policy (Authenticated Delete):**
        ```sql
        CREATE POLICY "Allow authenticated users to delete their own avatars"
        ON storage.objects FOR DELETE
        TO authenticated
        USING ( bucket_id = 'avatars' AND auth.uid() = ((storage.foldername(name))[1])::uuid );