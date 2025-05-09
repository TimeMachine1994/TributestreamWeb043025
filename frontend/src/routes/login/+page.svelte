 <script lang="ts">
 	import { enhance } from '$app/forms';
 	import { page } from '$app/state';
 
 	let form = $state({
 		email: '',
 		password: ''
 	});
 </script>

<form method="POST" use:enhance class="max-w-sm mx-auto mt-20 p-6 bg-white shadow rounded space-y-4">
	<h2 class="text-2xl font-semibold text-center">Login</h2>

	{#if $page.form?.message}
		<p class="text-red-500 text-sm text-center">{$page.form.message}</p>
	{/if}

	<div>
		<label class="block text-sm font-medium mb-1" for="email">Email</label>
		<input
			class="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:ring-blue-200"
			id="email"
			name="email"
			type="email"
			bind:value={form.email}
			required
		/>
		{#if $page.form?.email}
			<p class="text-red-500 text-xs mt-1">{$page.form.email}</p>
		{/if}
	</div>

	<div>
		<label class="block text-sm font-medium mb-1" for="password">Password</label>
		<input
			class="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:ring-blue-200"
			id="password"
			name="password"
			type="password"
			bind:value={form.password}
			required
		/>
		{#if $page.form?.password}
			<p class="text-red-500 text-xs mt-1">{$page.form.password}</p>
		{/if}
	</div>

	<button
		type="submit"
		class="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
	>
		Log In
	</button>
</form>
