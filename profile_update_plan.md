# Plan: Update Profile Page with User Data

**Goal:** Display the logged-in user's information (email, placeholder name) on `profile.html` and redirect unauthenticated users.

**Steps:**

1.  **Modify `profile.html`:**
    *   **Add IDs:** Assign unique IDs to the elements needing updates:
        *   Avatar Initial: `id="profile-avatar-initial"` (on `<span>`)
        *   Main Name: `id="profile-main-name"` (on `<h2>`)
        *   Detail Name: `id="profile-detail-name"` (on `<span class="detail-value">`)
        *   Detail Email: `id="profile-email-value"` (on `<span class="detail-value">`)
    *   **Add Script Tags:** Include the Supabase JS library and `script.js` *before* the existing inline `<script>` tag:
        ```html
        <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
        <script src="script.js"></script>
        <!-- Existing inline script follows -->
        ```
2.  **Add Logic to Inline Script (in `profile.html`):**
    *   Define a new `async function loadUserProfile()` within the existing inline `<script>`.
    *   Call `loadUserProfile()` inside the `DOMContentLoaded` event listener.
    *   Inside `loadUserProfile()`:
        *   Use `await supabaseClient.auth.getUser()` to get the current user session.
        *   If no user is logged in (`!user`), redirect to `signup.html` (`window.location.href = 'signup.html';`).
        *   If a user *is* found:
            *   Get the email (`user.email`).
            *   Use the email prefix (part before "@") as a placeholder for the name.
            *   Get the first letter of the name placeholder for the avatar initial.
            *   Find elements by their new IDs (`document.getElementById(...)`).
            *   Update the `textContent` of the email, name, and avatar initial elements.

**Conceptual Flow Diagram:**

```mermaid
graph TD
    subgraph profile.html Load
        A[HTML Loads] --> B(Add IDs to elements);
        A --> C(Load Supabase JS Lib);
        A --> D(Load script.js);
        D --> E(Inline Script Executes);
    end

    subgraph Inline Script Logic
        F[DOMContentLoaded Event] --> G[Call loadUserProfile()];
        G --> H{loadUserProfile()};
        H --> I{supabaseClient.auth.getUser()};
        I -- No User/Error --> J[Redirect to signup.html];
        I -- User Found --> K[Get user.email];
        K --> L[Extract Name Placeholder (email prefix)];
        K --> M[Find Email Element by ID];
        L --> N[Find Name Elements by ID];
        L --> O[Find Avatar Element by ID];
        M --> P[Update Email Text];
        N --> Q[Update Name Texts];
        O --> R[Update Avatar Initial];
    end

    E --> F;