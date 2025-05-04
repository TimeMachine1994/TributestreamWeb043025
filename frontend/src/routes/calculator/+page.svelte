<script lang="ts">
    import { goto } from '$app/navigation';
    import { createLogger } from '$lib/logger';
    import { saveCalculatorData } from '$lib/state/calculatorState.svelte';
    import { startCheckout } from '$lib/state/checkout.svelte';
    
    // Create a dedicated logger
    const logger = createLogger('CalculatorPage');

    // No need to import fetch, it's globally available

    // Convert all stores to Svelte 5 runes
    let currentPage = $state(1);
    let livestreamAtFuneralHome = $state(false);
    let selectedPackage = $state('');
    let formData = $state({
        yourName: '',
        email: '',
        phoneNumber: '',
        livestreamDate: '',
        livestreamTime: '',
        livestreamLocation: '',
        secondAddress: '',
        thirdAddress: ''
    });
    let urlFriendlyText = $state('tribute-stream');
    let livestreamDuration = $state(1);
    let additionalLocations = $state({
        secondAddress: false,
        thirdAddress: false
    });
    let masterPrice = $state(0);
    // Define type for additional charges
    let additionalCharges = $state<{item: string, price: number}[]>([]);
    
    // Derived values
    let totalCost = $derived(masterPrice + additionalCharges.reduce((sum: number, charge: {price: number}) => sum + charge.price, 0));

    // UI state
    let editing = $state(false);
    let tempUrlText = $state('');  // Temporary storage for editing
    let isSaving = $state(false);
    let saveError = $state('');
    let saveSuccess = $state('');

    // Functions
    function startEdit() {
        editing = true;
        tempUrlText = urlFriendlyText;  // Copy current URL text to temporary variable
    }

    function saveEdit() {
        convertText(tempUrlText);  // Update the urlFriendlyText
        editing = false;  // Exit editing mode
    }

    function convertText(text: string) {
        urlFriendlyText = text.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    }

    function cancelEdit() {
        editing = false;
        tempUrlText = '';  // Clear temporary storage
    }

    function nextStep() {
        currentPage += 1;
    }

    function previousStep() {
        currentPage -= 1;
    }

    async function handleSubmit() {
        try {
            // Prepare data for submission to Strapi
            const submissionData = {
                customerName: formData.yourName,
                email: formData.email,
                phoneNumber: formData.phoneNumber,
                livestreamDate: formData.livestreamDate,
                livestreamTime: formData.livestreamTime,
                livestreamLocation: formData.livestreamLocation,
                livestreamAtFuneralHome: livestreamAtFuneralHome,
                selectedPackage: selectedPackage,
                livestreamDuration: livestreamDuration,
                additionalLocations: additionalLocations,
                totalCost: totalCost,
                urlFriendlyText: urlFriendlyText
            };

            // Submit to Strapi backend
            const response = await fetch('/api/calculator-submissions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ data: submissionData })
            });

            if (!response.ok) {
                throw new Error('Failed to submit form');
            }

            const result = await response.json();
            logger.success('🎉 Form submitted successfully!', result);
            alert('Submission complete! Your livestream has been scheduled.');
            
            // Redirect or reset form as needed
        } catch (error) {
            logger.error('❌ Error submitting form:', error);
            alert('There was an error submitting your form. Please try again.');
        }
    }
    
    /**
     * Save calculator data and proceed to checkout or save for later
     * @param checkoutNow Whether to proceed to checkout immediately
     */
    async function saveAndCheckout(checkoutNow: boolean) {
        try {
            isSaving = true;
            saveError = '';
            saveSuccess = '';
            
            // Validate form
            if (!formData.yourName || !formData.email || !formData.phoneNumber) {
                saveError = 'Please fill in all required fields';
                isSaving = false;
                return;
            }
            
            if (!formData.livestreamDate || !formData.livestreamTime || !formData.livestreamLocation) {
                saveError = 'Please provide livestream details';
                isSaving = false;
                return;
            }
            
            if (!selectedPackage) {
                saveError = 'Please select a package';
                isSaving = false;
                return;
            }
            
            // Prepare calculator data
            const calculatorFormData = {
                customerName: formData.yourName,
                email: formData.email,
                phoneNumber: formData.phoneNumber,
                livestreamDate: formData.livestreamDate,
                livestreamTime: formData.livestreamTime,
                livestreamLocation: formData.livestreamLocation,
                livestreamAtFuneralHome: livestreamAtFuneralHome,
                selectedPackage: selectedPackage,
                livestreamDuration: livestreamDuration,
                additionalLocations: additionalLocations,
                secondAddress: formData.secondAddress,
                thirdAddress: formData.thirdAddress,
                urlFriendlyText: urlFriendlyText,
                totalCost: totalCost
            };
            
            // Save calculator data
            logger.info('💾 Saving calculator data', calculatorFormData);
            const savedData = saveCalculatorData(calculatorFormData);
            
            if (!savedData) {
                throw new Error('Failed to save calculator data');
            }
            
            logger.success('✅ Calculator data saved successfully', { id: savedData.id });
            
            // Start checkout process
            const checkoutStarted = startCheckout(savedData.id, checkoutNow);
            
            if (!checkoutStarted) {
                throw new Error('Failed to start checkout process');
            }
            
            if (checkoutNow) {
                logger.info('🛒 Proceeding to checkout', { id: savedData.id });
                // Navigation handled by startCheckout function
            } else {
                logger.info('💾 Saved for later checkout', { id: savedData.id });
                saveSuccess = 'Your livestream details have been saved. You can complete checkout later from your dashboard.';
                
                // Navigate to dashboard after a short delay
                setTimeout(() => {
                    goto('/family-dashboard');
                }, 2000);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger.error('❌ Error saving calculator data', { error: errorMessage });
            saveError = `Failed to save: ${errorMessage}`;
        } finally {
            isSaving = false;
        }
    }

    // Utility function to handle package selection with visual feedback
    function selectPackage(packageName: string) {
        selectedPackage = packageName;
        
        // Set price based on package
        switch(packageName) {
            case 'Solo':
                masterPrice = 399;
                break;
            case 'Anywhere':
                masterPrice = 499;
                break;
            case 'Legacy':
                masterPrice = 799;
                break;
            default:
                masterPrice = 0;
        }
        
        // Update additional charges based on selections
        updateAdditionalCharges();
    }

    // Update additional charges based on current selections
    function updateAdditionalCharges() {
        let charges: {item: string, price: number}[] = [];
        
        // Add charge for extended duration if more than 1 hour
        if (livestreamDuration > 1) {
            charges.push({
                item: `Extended Duration (${livestreamDuration} hours)`,
                price: (livestreamDuration - 1) * 50
            });
        }
        
        // Add charges for additional locations
        if (additionalLocations.secondAddress) {
            charges.push({
                item: 'Second Location',
                price: 100
            });
        }
        
        if (additionalLocations.thirdAddress) {
            charges.push({
                item: 'Third Location',
                price: 100
            });
        }
        
        additionalCharges = charges;
    }

    // Effect to update additional charges when relevant state changes
    $effect(() => {
        // This will run whenever these dependencies change
        livestreamDuration;
        additionalLocations.secondAddress;
        additionalLocations.thirdAddress;
        
        updateAdditionalCharges();
    });
</script>

<svelte:head>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.1/css/all.min.css">
</svelte:head>

<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-black">
    <div class="bg-white shadow overflow-hidden sm:rounded-lg">
        <div class="px-4 py-5 sm:px-6 flex justify-between items-center">
            <h3 class="text-lg leading-6 font-medium text-gray-900">Livestream Setup</h3>
            <div class="text-sm text-gray-500">Step {currentPage} of 5</div>
        </div>
        <!-- Custom Link Display -->
        <div class="text-center py-4">
            <div class="text-lg font-medium text-gold-500">Your Loved One's Custom Link:</div>
            {#if editing}
                <div class="inline-flex items-center">
                    <input type="text" class="text-md text-gold-500 border border-gray-300 focus:ring-0" bind:value={tempUrlText} />
                    <i class="fas fa-check text-green-500 cursor-pointer ml-2" on:click={saveEdit}></i>
                    <i class="fas fa-times text-red-500 cursor-pointer ml-2" on:click={cancelEdit}></i>
                </div>
            {:else}
                <div class="text-md text-gold-500 cursor-pointer" on:click={startEdit}>
                    {urlFriendlyText} <i class="fas fa-pencil-alt pl-2"></i>
                </div>
            {/if}
        </div>
        <div class="border-t border-gray-200 flex">
            <div class="{(currentPage >= 4 ? 'w-2/3' : 'w-full')} p-6">
                <!-- Dynamic form content based on currentPage -->
                {#if currentPage === 1}
                <!-- Basic Information Form -->
                <div class="px-4 py-5 sm:p-6">
                    <div class="grid grid-cols-1 gap-y-6">
                        <div>
                            <label for="your-name" class="block text-sm font-medium text-gray-700">Your Name</label>
                            <input type="text" id="your-name" bind:value={formData.yourName} placeholder="Your Name" class="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"/>
                        </div>
                        <div>
                            <label for="email" class="block text-sm font-medium text-gray-700">Your Email Address</label>
                            <input type="email" id="email" bind:value={formData.email} placeholder="Email" class="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"/>
                        </div>
                        <div>
                            <label for="phone-number" class="block text-sm font-medium text-gray-700">Phone Number</label>
                            <input type="text" id="phone-number" bind:value={formData.phoneNumber} placeholder="Phone Number" class="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"/>
                        </div>
                    </div>
                </div>
                {:else if currentPage === 2}
                <!-- Livestream Details Form -->
                <div class="px-4 py-5 sm:p-6">
                    <div class="grid grid-cols-1 gap-y-6">
                        <div>
                            <label for="livestream-date" class="block text-sm font-medium text-gray-700">Livestream Date</label>
                            <input type="date" id="livestream-date" bind:value={formData.livestreamDate} placeholder="Select Date" class="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"/>
                        </div>
                        <div>
                            <label for="start-time" class="block text-sm font-medium text-gray-700">Livestream Start Time</label>
                            <input type="time" id="start-time" bind:value={formData.livestreamTime} class="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"/>
                        </div>
                        <div>
                            <label for="livestream-location" class="block text-sm font-medium text-gray-700">Livestream Location</label>
                            <input type="text" id="livestream-location" bind:value={formData.livestreamLocation} placeholder="Location" class="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"/>
                        </div>
                        <div>
                            <div class="flex items-center">
                                <input id="funeral-home" type="checkbox" bind:checked={livestreamAtFuneralHome} class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"/>
                                <label for="funeral-home" class="ml-2 block text-sm text-gray-900">Is this at a funeral home?</label>
                            </div>
                        </div>
                    </div>
                </div>
                {:else if currentPage === 3}
                <!-- Package Selection Form -->
                <div class="px-4 py-5 sm:p-6">
                    <div class="grid grid-cols-1 gap-y-4">
                        {#if livestreamAtFuneralHome}
                        <button on:click={() => selectPackage('Solo')} class={`w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md ${selectedPackage === 'Solo' ? 'text-white bg-blue-600' : 'text-blue-600 bg-white hover:bg-blue-100'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}>
                            Solo Package - $399 {#if selectedPackage === 'Solo'}(Selected){/if}
                        </button>
                        {/if}
                        <button on:click={() => selectPackage('Anywhere')} class={`w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md ${selectedPackage === 'Anywhere' ? 'text-white bg-blue-600' : 'text-blue-600 bg-white hover:bg-blue-100'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}>
                            Anywhere Package - $499 {#if selectedPackage === 'Anywhere'}(Selected){/if}
                        </button>
                        <button on:click={() => selectPackage('Legacy')} class={`w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md ${selectedPackage === 'Legacy' ? 'text-white bg-blue-600' : 'text-blue-600 bg-white hover:bg-blue-100'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}>
                            Legacy Package - $799 {#if selectedPackage === 'Legacy'}(Selected){/if}
                        </button>
                    </div>
                </div>
                {:else if currentPage === 4}
                <!-- Additional Options Form -->
                <div class="px-4 py-5 sm:p-6">
                    <div class="grid grid-cols-1 gap-y-4">
                        <div>
                            <label for="duration" class="block text-sm font-medium text-gray-700">Livestream Duration (hours)</label>
                            <input type="range" id="duration" min="1" max="8" bind:value={livestreamDuration} class="mt-1 block w-full" />
                            <div class="text-right text-sm text-gray-600">{livestreamDuration} hours</div>
                        </div>
                        <div>
                            <div class="flex items-center">
                                <input id="second-address" type="checkbox" bind:checked={additionalLocations.secondAddress} class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"/>
                                <label for="second-address" class="ml-2 block text-sm text-gray-900">Add second address?</label>
                            </div>
                            {#if additionalLocations.secondAddress}
                            <input type="text" bind:value={formData.secondAddress} placeholder="Enter second address" class="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"/>
                            {/if}
                        </div>
                        <div>
                            <div class="flex items-center">
                                <input id="third-address" type="checkbox" bind:checked={additionalLocations.thirdAddress} class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"/>
                                <label for="third-address" class="ml-2 block text-sm text-gray-900">Add third address?</label>
                            </div>
                            {#if additionalLocations.thirdAddress}
                            <input type="text" bind:value={formData.thirdAddress} placeholder="Enter third address" class="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"/>
                            {/if}
                        </div>
                    </div>
                </div>
                {:else if currentPage === 5}
                <!-- Summary and Confirmation -->
                <div class="px-4 py-5 sm:p-6">
                    <div class="grid grid-cols-1 gap-y-4">
                        <div class="text-sm font-medium text-gray-900">Summary of your selections:</div>
                        <div class="text-sm text-gray-500">Name: {formData.yourName}</div>
                        <div class="text-sm text-gray-500">Email: {formData.email}</div>
                        <div class="text-sm text-gray-500">Phone: {formData.phoneNumber}</div>
                        <div class="text-sm text-gray-500">Date: {formData.livestreamDate}</div>
                        <div class="text-sm text-gray-500">Package: {selectedPackage}</div>
                        <div class="text-sm text-gray-500">Additional Addresses: {JSON.stringify(additionalLocations)}</div>
                        <div class="text-sm text-gray-500">Total Cost: ${totalCost}</div>
                        
                        {#if saveError}
                            <div class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md" role="alert">
                                <p>{saveError}</p>
                            </div>
                        {/if}
                        
                        {#if saveSuccess}
                            <div class="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-md" role="alert">
                                <p>{saveSuccess}</p>
                            </div>
                        {/if}
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <button
                                on:click={() => saveAndCheckout(true)}
                                class="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                disabled={isSaving}
                            >
                                {#if isSaving}
                                    <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Processing...
                                {:else}
                                    Save & Checkout Now
                                {/if}
                            </button>
                            
                            <button
                                on:click={() => saveAndCheckout(false)}
                                class="w-full inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                disabled={isSaving}
                            >
                                {#if isSaving}
                                    <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Processing...
                                {:else}
                                    Save & Checkout Later
                                {/if}
                            </button>
                        </div>
                        
                        <div class="text-xs text-gray-500 text-center mt-2">
                            "Save & Checkout Later" will save your selections to your dashboard for later completion.
                        </div>
                    </div>
                </div>
                {/if}
            </div>
            {#if currentPage >= 4}
            <div class="w-1/3 bg-gray-100 p-6 border-l border-gray-200">
                <h4 class="text-lg font-semibold mb-4">Your Cart</h4>
                <ul class="text-sm">
                    <li>Package: {selectedPackage} - ${masterPrice}</li>
                    {#each additionalCharges as charge}
                    <li>{charge.item}: +${charge.price}</li>
                    {/each}
                    <li class="font-bold mt-2">Total Cost: ${totalCost}</li>
                </ul>
            </div>
            {/if}
        </div>
        <div class="px-4 py-3 bg-gray-50 text-right sm:px-6">
            {#if currentPage > 1}
            <button class="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500" on:click={previousStep}>
                Back
            </button>
            {/if}
            {#if currentPage < 5}
            <button class="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500" on:click={nextStep}>
                Next
            </button>
            {/if}
            {#if currentPage === 5}
            <button
                class="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                on:click={() => saveAndCheckout(true)}
                disabled={isSaving}
            >
                {#if isSaving}
                    <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                {:else}
                    Save & Checkout Now
                {/if}
            </button>
            {/if}
        </div>
    </div>
</div>
