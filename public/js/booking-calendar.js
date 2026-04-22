document.addEventListener('DOMContentLoaded', async () => {
  const priceDisplay = document.getElementById('booking-price-display');
  
  if (!priceDisplay) return; // Exit if not on a page with booking form
  
  const listingId = document.getElementById('booking-form').getAttribute('action').split('/')[2];
  const pricePerNight = Number(priceDisplay.getAttribute('data-price'));
  
  const dateInput = document.getElementById('booking-dates');
  const checkinInput = document.getElementById('booking-checkin');
  const checkoutInput = document.getElementById('booking-checkout');
  const totalPriceInput = document.getElementById('booking-totalprice');
  const totalDisplay = document.getElementById('booking-total-display');
  
  let disableDates = [];
  try {
    const response = await fetch(`/listings/${listingId}/bookings/booked-dates`);
    const bookedRanges = await response.json();
    disableDates = bookedRanges;
  } catch(e) {
    console.error("Failed to fetch booked dates", e);
  }

  flatpickr(dateInput, {
    mode: "range",
    minDate: "today",
    disable: disableDates,
    dateFormat: "Y-m-d",
    onChange: function(selectedDates, dateStr, instance) {
      if (selectedDates.length === 2) {
        const start = selectedDates[0];
        const end = selectedDates[1];
        
        // Calculate nights
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return; // Same day booking not allowed or 0 price
        
        const total = diffDays * pricePerNight;
        
        // Update hidden inputs
        checkinInput.value = start.toISOString();
        checkoutInput.value = end.toISOString();
        totalPriceInput.value = total;
        
        // Update UI using template literals safely because this is now a pure .js file!
        totalDisplay.innerHTML = `&#8377; ${pricePerNight.toLocaleString("en-IN")} x ${diffDays} nights = <span class="font-bold text-zinc-900">&#8377; ${total.toLocaleString("en-IN")}</span>`;
      } else {
        totalDisplay.innerHTML = "Select dates to see total";
        checkinInput.value = "";
        checkoutInput.value = "";
        totalPriceInput.value = "";
      }
    }
  });
});
