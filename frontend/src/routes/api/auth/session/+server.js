export async function GET({ cookies }) {
    const jwt = cookies.get('jwt');

    if (!jwt) {
        return new Response(JSON.stringify({ user: null }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const res = await fetch('https://miraculous-morning-0acdf6e165.strapiapp.com/api/users/me', {
        headers: { Authorization: `Bearer ${jwt}` }
    });

    if (!res.ok) {
        return new Response(JSON.stringify({ user: null }), {
            status: res.status,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const user = await res.json();
    return new Response(JSON.stringify({ user }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
    });
}