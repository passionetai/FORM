// script.js

// --- Supabase Initialization ---
const supabaseUrl = 'https://uhukhyovftxdcqefhnpu.supabase.co'; // Paste your Project URL here
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVodWtoeW92ZnR4ZGNxZWZobnB1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI5NDAwOTUsImV4cCI6MjA1ODUxNjA5NX0.L18svnRNiM0p9MiFsBcjaeZ6A8jsCyYZiWEvPpBHv60'; // Paste your anon public key here

// Create a single Supabase client for interacting with your database
const supabase = supabaseJs.createClient(supabaseUrl, supabaseAnonKey);

// --- End Supabase Initialization ---

// ... rest of your existing JavaScript code (like switchAuthTab, etc.) ...
// Signup/Login Page Tab Functionality
function switchAuthTab(evt, tabName) {
    evt.preventDefault();
    
    const tabsContainer = document.getElementById('form-tabs-container');
    const contentContainer = document.getElementById('form-content-container');
    
    // Update tab buttons
    const tabButtons = tabsContainer.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
        button.classList.remove('active');
    });
    evt.currentTarget.classList.add('active');

    // Update tab contents
    const tabContents = contentContainer.querySelectorAll('.tab-pane');
    tabContents.forEach(content => {
        content.style.display = 'none';
    });
    
    // Show selected content
    document.getElementById(tabName).style.display = 'block';
}

// Voucher Page Tab Functionality
function switchVoucherTab(evt, tabName) {
    evt.preventDefault();
    
    const tabsContainer = document.querySelector('.voucher-page .tabs');
    const contentContainer = document.querySelector('.voucher-page .tab-content-area');
    
    // Update tab buttons
    const tabButtons = tabsContainer.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
        button.classList.remove('active');
    });
    evt.currentTarget.classList.add('active');

    // Update tab contents
    const tabContents = contentContainer.querySelectorAll('.tab-pane');
    tabContents.forEach(content => {
        content.style.display = 'none';
    });
    
    // Show selected content
    document.getElementById(tabName).style.display = 'block';
}

// Initialize tabs on page load
document.addEventListener('DOMContentLoaded', function() {
    // Initialize tabs on page load (Your existing code)
    if (document.getElementById('form-tabs-container')) {
        // Ensure the first tab button exists before clicking
        const firstTabButton = document.querySelector('#form-tabs-container .tab-button');
        if(firstTabButton) firstTabButton.click();
    }
    if (document.querySelector('.voucher-page')) {
         // Ensure the first tab button exists before clicking
        const firstVoucherTabButton = document.querySelector('.voucher-page .tab-button');
         if(firstVoucherTabButton) firstVoucherTabButton.click();
    }

    // --- Signup Form Handling ---
    const signupForm = document.getElementById('signup-form');

    if (signupForm) { // Check if the form exists on the current page
        signupForm.addEventListener('submit', async (event) => {
            event.preventDefault(); // Stop the default browser form submission

            const emailInput = document.getElementById('signup-email');
            const passwordInput = document.getElementById('signup-password');
            // Optional: Get first/last name if you want to store them later
            // const firstNameInput = document.getElementById('signup-first-name');
            // const lastNameInput = document.getElementById('signup-last-name');

            const email = emailInput.value.trim();
            const password = passwordInput.value.trim();

            // Basic validation (you can add more)
            if (!email || !password) {
                alert('Please enter both email and password.');
                return;
            }
             if (password.length < 6) {
                alert('Password should be at least 6 characters.');
                return;
             }


            try {
                // Attempt to sign up the user with Supabase Auth
                const { data, error } = await supabase.auth.signUp({
                    email: email,
                    password: password,
                    // Optional: You can add metadata here later
                    // options: {
                    //   data: {
                    //     first_name: firstNameInput.value.trim(),
                    //     last_name: lastNameInput.value.trim()
                    //   }
                    // }
                });

                if (error) {
                    // If Supabase returns an error, show it
                    console.error('Signup Error:', error);
                    alert(`Signup failed: ${error.message}`);
                } else if (data.user) {
                    // If signup is successful (or needs confirmation)
                    alert('Signup successful! Please check your email to confirm your account.'); // Modify if email confirmation is off
                    // Redirect to the home page
                    window.location.href = 'index.html';
                } else {
                     alert('Signup attempt completed, but no user data returned. Please check email or try again.');
                }

            } catch (catchError) {
                // Catch any unexpected errors during the process
                console.error('Unexpected Signup Error:', catchError);
                alert('An unexpected error occurred during signup. Please try again.');
            }
        });
    }
    // --- End Signup Form Handling ---
// script.js (inside DOMContentLoaded, after signup handling)

    // --- Login Form Handling ---
    const loginForm = document.getElementById('login-form');

    if (loginForm) { // Check if the form exists
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault(); // Stop default submission

            const emailInput = document.getElementById('login-email');
            const passwordInput = document.getElementById('login-password');

            const email = emailInput.value.trim();
            const password = passwordInput.value.trim();

            if (!email || !password) {
                alert('Please enter both email and password.');
                return;
            }

            try {
                // Attempt to sign in the user
                const { data, error } = await supabase.auth.signInWithPassword({
                    email: email,
                    password: password,
                });

                if (error) {
                    // If login fails (wrong password, user not found etc.)
                    console.error('Login Error:', error);
                    alert(`Login failed: ${error.message}`);
                } else if (data.user) {
                    // Login successful!
                    // alert('Login successful!'); // Optional: show success message
                    // Redirect to the home page
                    window.location.href = 'index.html';
                } else {
                     alert('Login attempt completed, but no user data returned. Please try again.');
                }

            } catch (catchError) {
                console.error('Unexpected Login Error:', catchError);
                alert('An unexpected error occurred during login. Please try again.');
            }
        });
    }
    // --- End Login Form Handling ---

    // Animation styles
    const style = document.createElement('style');
    style.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(5px); }
        to { opacity: 1; transform: translateY(0); }
    }
    .tab-pane {
        animation: fadeIn 0.3s ease-in-out;
    }
    `;
    document.head.appendChild(style);
}); // End DOMContentLoaded
