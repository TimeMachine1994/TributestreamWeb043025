<script lang="ts">
	import '../app.css';
	import BackendStatus from '$lib/components/BackendStatus.svelte';
	import Navbar from '$lib/components/Navbar.svelte';

	let { data, children } = $props<{ data: { authenticated: boolean } }>();
	
	// Track page loading state
	let isNavigating = $state(false);
	
	// Listen for navigation events
	$effect(() => {
		console.log("🔄 Layout loaded with auth status:", data.authenticated);
		
		// Add navigation event listeners
		const handleNavigationStart = () => {
			console.log("🚀 Navigation started");
			isNavigating = true;
		};
		
		const handleNavigationEnd = () => {
			console.log("✅ Navigation completed");
			isNavigating = false;
		};
		
		// Add event listeners
		document.addEventListener('sveltekit:navigation-start', handleNavigationStart);
		document.addEventListener('sveltekit:navigation-end', handleNavigationEnd);
		
		// Cleanup
		return () => {
			document.removeEventListener('sveltekit:navigation-start', handleNavigationStart);
			document.removeEventListener('sveltekit:navigation-end', handleNavigationEnd);
		};
	});
</script>

<div class="flex flex-col min-h-screen">
	<Navbar authenticated={data.authenticated} user={data.user} />
	
	{#if isNavigating}
		<div class="loading-bar"></div>
	{/if}
	
	<div class="container mx-auto px-4 py-8 flex-grow">
		<BackendStatus />
		
		<main>
			{@render children()}
		</main>
	</div>
	
	<style>
		.loading-bar {
			position: fixed;
			top: 0;
			left: 0;
			width: 100%;
			height: 3px;
			background: linear-gradient(90deg, #4CAF50, #2196F3, #9C27B0);
			background-size: 200% 100%;
			animation: loading-bar-animation 1.5s infinite;
			z-index: 1000;
		}
		
		@keyframes loading-bar-animation {
			0% {
				background-position: 0% 50%;
			}
			50% {
				background-position: 100% 50%;
			}
			100% {
				background-position: 0% 50%;
			}
		}
	</style>
	
	<footer class="bg-gray-100 py-6">
		<div class="container mx-auto px-4 text-center text-gray-600">
			<p>© {new Date().getFullYear()} TributeStream. All rights reserved.</p>
		</div>
	</footer>
</div>
