<script lang="ts">
  import { goto } from '$app/navigation';
  import { createLogger } from '$lib/logger';
  import { additionalCosts } from '$lib/packages';
  
  // Create a dedicated logger for the checkout page
  const logger = createLogger('CheckoutPage');
  
  // Get data from server
  let { data, form } = $props();
  
  // Reactive state
  let billingFirstName = $state('');
  let billingLastName = $state('');
  let billingAddress = $state('');
  let cardNumber = $state('');
  let cardExpiry = $state('');
  let cardCvv = $state('');
  let isSubmitting = $state(false);
  let formErrors = $state<Record<string, string>>({});
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };
  
  // Calculate additional costs
  let extraHoursCost = $derived(
    data.calculatorData.liveStreamDuration > 1 
      ? (data.calculatorData.liveStreamDuration - 1) * additionalCosts.extraHour 
      : 0
  );
  
  let extraLocationsCost = $derived(
    data.calculatorData.locations.length > 1 
      ? (data.calculatorData.locations.length - 1) * additionalCosts.extraLocation 
      : 0
  );
  
  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  // Validate form
  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!billingFirstName) {
      errors.billingFirstName = 'First name is required';
    }
    
    if (!billingLastName) {
      errors.billingLastName = 'Last name is required';
    }
    
    if (!billingAddress) {
      errors.billingAddress = 'Address is required';
    }
    
    if (!cardNumber) {
      errors.cardNumber = 'Card number is required';
    } else if (!/^\d{16}$/.test(cardNumber.replace(/\s/g, ''))) {
      errors.cardNumber = 'Card number must be 16 digits';
    }
    
    if (!cardExpiry) {
      errors.cardExpiry = 'Expiry date is required';
    } else if (!/^\d{2}\/\d{2}$/.test(cardExpiry)) {
      errors.cardExpiry = 'Expiry date must be in MM/YY format';
    }
    
    if (!cardCvv) {
      errors.cardCvv = 'CVV is required';
    } else if (!/^\d{3,4}$/.test(cardCvv)) {
      errors.cardCvv = 'CVV must be 3 or 4 digits';
    }
    
    formErrors = errors;
    return Object.keys(errors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = () => {
    logger.info('🔄 Submitting checkout form');
    
    if (!validateForm()) {
      logger.warning('⚠️ Form validation failed', { errors: formErrors });
      return;
    }
    
    isSubmitting = true;
    logger.debug('✅ Form validation passed, submitting payment');
  };
  
  // Handle form action result
  $effect(() => {
    if (form?.success) {
      logger.success('✅ Payment processed successfully');
      
      if (form.redirect) {
        logger.info('🔄 Redirecting to', { url: form.redirect });
        goto(form.redirect);
      }
    } else if (form?.error) {
      logger.error('❌ Payment processing failed', { error: form.error });
      isSubmitting = false;
    }
  });
</script>

<svelte:head>
  <title>Checkout | TributeStream</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <h1 class="text-3xl font-bold mb-8 text-center">Complete Your Purchase</h1>
  
  {#if data.error}
    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6" role="alert">
      <p>{data.error}</p>
    </div>
  {/if}
  
  {#if form?.error}
    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6" role="alert">
      <p>{form.error}</p>
    </div>
  {/if}
  
  <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
    <!-- Order Summary -->
    <div class="bg-gray-50 p-6 rounded-lg shadow-md">
      <h2 class="text-2xl font-semibold mb-4">Order Summary</h2>
      
      {#if data.selectedPackage}
        <div class="mb-6">
          <h3 class="text-xl font-medium mb-2">{data.selectedPackage.name}</h3>
          <p class="text-gray-600 mb-2">{data.selectedPackage.description}</p>
          <div class="flex justify-between items-center">
            <span>Base Package</span>
            <span class="font-semibold">{formatCurrency(data.selectedPackage.basePrice)}</span>
          </div>
        </div>
        
        <div class="border-t border-gray-200 my-4"></div>
        
        <!-- Additional Options -->
        <div class="mb-6">
          <h3 class="text-lg font-medium mb-2">Additional Options</h3>
          
          {#if data.calculatorData.liveStreamDuration > 1}
            <div class="flex justify-between items-center mb-2">
              <span>Extra Livestream Hours ({data.calculatorData.liveStreamDuration - 1})</span>
              <span>{formatCurrency(extraHoursCost)}</span>
            </div>
          {/if}
          
          {#if data.calculatorData.locations.length > 1}
            <div class="flex justify-between items-center mb-2">
              <span>Extra Locations ({data.calculatorData.locations.length - 1})</span>
              <span>{formatCurrency(extraLocationsCost)}</span>
            </div>
          {/if}
        </div>
        
        <div class="border-t border-gray-200 my-4"></div>
        
        <!-- Event Details -->
        <div class="mb-6">
          <h3 class="text-lg font-medium mb-2">Event Details</h3>
          
          <div class="mb-2">
            <span class="font-medium">Date:</span> 
            <span>{formatDate(data.calculatorData.liveStreamDate)}</span>
          </div>
          
          <div class="mb-2">
            <span class="font-medium">Start Time:</span> 
            <span>{data.calculatorData.liveStreamStartTime}</span>
          </div>
          
          <div class="mb-2">
            <span class="font-medium">Duration:</span> 
            <span>{data.calculatorData.liveStreamDuration} hour{data.calculatorData.liveStreamDuration > 1 ? 's' : ''}</span>
          </div>
          
          {#if data.calculatorData.funeralHomeName}
            <div class="mb-2">
              <span class="font-medium">Funeral Home:</span> 
              <span>{data.calculatorData.funeralHomeName}</span>
            </div>
          {/if}
          
          {#if data.calculatorData.funeralDirectorName}
            <div class="mb-2">
              <span class="font-medium">Funeral Director:</span> 
              <span>{data.calculatorData.funeralDirectorName}</span>
            </div>
          {/if}
        </div>
        
        {#if data.calculatorData.locations.length > 0}
          <div class="mb-6">
            <h3 class="text-lg font-medium mb-2">Locations</h3>
            
            {#each data.calculatorData.locations as location, i}
              <div class="mb-3 p-3 bg-white rounded">
                <div class="font-medium">{location.name}</div>
                <div class="text-sm text-gray-600">{location.address}</div>
                <div class="text-sm">
                  Start: {location.startTime}, 
                  Duration: {location.duration} hour{location.duration > 1 ? 's' : ''}
                </div>
              </div>
            {/each}
          </div>
        {/if}
        
        <div class="border-t border-gray-200 my-4"></div>
        
        <!-- Total -->
        <div class="flex justify-between items-center text-xl font-bold">
          <span>Total</span>
          <span>{formatCurrency(data.calculatorData.priceTotal)}</span>
        </div>
      {:else}
        <p class="text-red-600">Package information not available. Please return to the calculator page.</p>
      {/if}
    </div>
    
    <!-- Payment Form -->
    <div class="bg-white p-6 rounded-lg shadow-md">
      <h2 class="text-2xl font-semibold mb-4">Payment Information</h2>
      
      <form method="POST" action="?/processPayment" on:submit|preventDefault={handleSubmit}>
        <!-- Hidden field for tribute ID -->
        <input type="hidden" name="tributeId" value={data.tributeData && 'id' in data.tributeData ? data.tributeData.id : ''}>
        
        <!-- Billing Information -->
        <div class="mb-6">
          <h3 class="text-lg font-medium mb-3">Billing Information</h3>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label for="billingFirstName" class="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <input
                type="text"
                id="billingFirstName"
                name="billingFirstName"
                bind:value={billingFirstName}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                class:border-red-500={formErrors.billingFirstName}
              >
              {#if formErrors.billingFirstName}
                <p class="text-red-500 text-xs mt-1">{formErrors.billingFirstName}</p>
              {/if}
            </div>
            
            <div>
              <label for="billingLastName" class="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <input
                type="text"
                id="billingLastName"
                name="billingLastName"
                bind:value={billingLastName}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                class:border-red-500={formErrors.billingLastName}
              >
              {#if formErrors.billingLastName}
                <p class="text-red-500 text-xs mt-1">{formErrors.billingLastName}</p>
              {/if}
            </div>
          </div>
          
          <div class="mb-4">
            <label for="billingAddress" class="block text-sm font-medium text-gray-700 mb-1">Billing Address</label>
            <textarea
              id="billingAddress"
              name="billingAddress"
              bind:value={billingAddress}
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              class:border-red-500={formErrors.billingAddress}
            ></textarea>
            {#if formErrors.billingAddress}
              <p class="text-red-500 text-xs mt-1">{formErrors.billingAddress}</p>
            {/if}
          </div>
        </div>
        
        <!-- Payment Details -->
        <div class="mb-6">
          <h3 class="text-lg font-medium mb-3">Payment Details</h3>
          
          <div class="mb-4">
            <label for="cardNumber" class="block text-sm font-medium text-gray-700 mb-1">Card Number</label>
            <input
              type="text"
              id="cardNumber"
              name="cardNumber"
              bind:value={cardNumber}
              placeholder="1234 5678 9012 3456"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              class:border-red-500={formErrors.cardNumber}
            >
            {#if formErrors.cardNumber}
              <p class="text-red-500 text-xs mt-1">{formErrors.cardNumber}</p>
            {/if}
          </div>
          
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="cardExpiry" class="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
              <input
                type="text"
                id="cardExpiry"
                name="cardExpiry"
                bind:value={cardExpiry}
                placeholder="MM/YY"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                class:border-red-500={formErrors.cardExpiry}
              >
              {#if formErrors.cardExpiry}
                <p class="text-red-500 text-xs mt-1">{formErrors.cardExpiry}</p>
              {/if}
            </div>
            
            <div>
              <label for="cardCvv" class="block text-sm font-medium text-gray-700 mb-1">CVV</label>
              <input
                type="text"
                id="cardCvv"
                name="cardCvv"
                bind:value={cardCvv}
                placeholder="123"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                class:border-red-500={formErrors.cardCvv}
              >
              {#if formErrors.cardCvv}
                <p class="text-red-500 text-xs mt-1">{formErrors.cardCvv}</p>
              {/if}
            </div>
          </div>
        </div>
        
        <!-- Submit Button -->
        <div class="mt-8">
          <button
            type="submit"
            class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSubmitting}
          >
            {#if isSubmitting}
              Processing...
            {:else}
              Complete Purchase - {formatCurrency(data.calculatorData.priceTotal)}
            {/if}
          </button>
        </div>
        
        <p class="text-sm text-gray-500 mt-4 text-center">
          Your payment information is secure and will not be stored.
        </p>
      </form>
    </div>
  </div>
</div>