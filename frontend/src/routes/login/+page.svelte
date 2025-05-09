<script lang="ts">
  import { enhance } from '$app/forms';
  let { form } = $props<{ form?: { email?: string; password?: string; message?: string } }>();

  let email = $state('');
  let password = $state('');
</script>

<form method="POST" use:enhance class="max-w-sm mx-auto mt-20 p-6 bg-white shadow rounded space-y-4">
  <h2 class="text-2xl font-semibold text-center">Login</h2>

  {#if form?.message}
    <p class="text-red-500 text-sm text-center">{form.message}</p>
  {/if}

  <div>
    <label class="block text-sm font-medium mb-1" for="email">Email</label>
    <input
      class="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:ring-blue-200"
      id="email"
      name="email"
      type="email"
      bind:value={email}
      required
    />
    {#if form?.email}
      <p class="text-red-500 text-xs mt-1">{form.email}</p>
    {/if}
  </div>

  <div>
    <label class="block text-sm font-medium mb-1" for="password">Password</label>
    <input
      class="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:ring-blue-200"
      id="password"
      name="password"
      type="password"
      bind:value={password}
      required
    />
    {#if form?.password}
      <p class="text-red-500 text-xs mt-1">{form.password}</p>
    {/if}
  </div>

  <button
    type="submit"
    class="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
  >
    Log In
  </button>
</form>
