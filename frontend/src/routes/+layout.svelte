<script lang="ts">
	import '../app.css';
	import Header from '$lib/components/global/Header.svelte';
	import Footer from '$lib/components/global/Footer.svelte';

	import { setContext } from 'svelte';
	let { children, data } = $props();
 	setContext('user', data.user);

	
</script>
<Header />
{@render children()}
{#if data.user}
	<p>Welcome back, {data.user.username}!</p>
{:else}
	<p>You are not logged in.</p>
{/if}
<Footer />
