// Mobile Navigation Functionality
document.addEventListener('DOMContentLoaded', function() {
    const moreMenuBtn = document.getElementById('more-menu-btn');
    const moreMenuItems = document.getElementById('more-menu-items');
    
    if (moreMenuBtn && moreMenuItems) {
        // Toggle menu on button click
        moreMenuBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation(); // Prevent event bubbling
            console.log('More menu button clicked. Element to toggle:', moreMenuItems); // Log the element
            console.log('Class list BEFORE toggle:', moreMenuItems.classList);
            moreMenuItems.classList.toggle('show'); // Use 'show' class to match CSS
            console.log('Class list AFTER toggle:', moreMenuItems.classList);
            console.log('More menu clicked, attempted toggling show class'); // Updated log
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', function(e) {
            // Check if menu has 'show' class and click is outside button/menu
            if (moreMenuItems.classList.contains('show') &&
                !moreMenuBtn.contains(e.target) &&
                !moreMenuItems.contains(e.target)) {
                moreMenuItems.classList.remove('show'); // Use 'show' class
                console.log('Clicked outside, closing menu');
            }
        });
    } else {
        console.log('Mobile nav elements not found');
    }
});
