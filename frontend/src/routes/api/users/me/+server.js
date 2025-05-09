export async function GET({ cookies }) {
    const jwt = cookies.get('jwt');

    const res = await fetch('https://miraculous-morning-0acdf6e165.strapiapp.com/api/users/me', {
        headers: {
            Authorization: `Bearer ${jwt}`
        }
    });

    const data = await res.json();
    return new Response(JSON.stringify(data), {
        status: res.status,
        headers: { 'Content-Type': 'application/json' }
    });
}