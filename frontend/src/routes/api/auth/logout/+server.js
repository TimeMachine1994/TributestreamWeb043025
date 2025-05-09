export async function POST({ cookies }) {
    cookies.set('jwt', '', {
        path: '/',
        expires: new Date(0)
    });

    return new Response(JSON.stringify({ message: 'Logged out' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
    });
}