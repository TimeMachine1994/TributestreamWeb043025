export async function POST({ request, cookies }) {
    const body = await request.json();

    const res = await fetch('https://miraculous-morning-0acdf6e165.strapiapp.com/api/auth/local', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });

    const data = await res.json();

    if (res.ok && data.jwt) {
        cookies.set('jwt', data.jwt, {
            httpOnly: true,
            secure: true,
            sameSite: 'lax',
            path: '/'
        });
    }

    return new Response(JSON.stringify(data), {
        status: res.status,
        headers: { 'Content-Type': 'application/json' }
    });
}