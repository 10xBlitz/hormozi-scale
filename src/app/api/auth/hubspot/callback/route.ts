import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error) {
    console.error('HubSpot OAuth error:', error)
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL || 'http://localhost:3002'}?hubspot_error=${error}`)
  }

  if (!code) {
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL || 'http://localhost:3002'}?hubspot_error=no_code`)
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch('https://api.hubapi.com/oauth/v1/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.HUBSPOT_CLIENT_ID!,
        client_secret: process.env.HUBSPOT_CLIENT_SECRET!,
        redirect_uri: `${process.env.NEXTAUTH_URL || 'http://localhost:3002'}/api/auth/hubspot/callback`,
        code: code,
      }),
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text()
      console.error('Token exchange failed:', errorData)
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL || 'http://localhost:3002'}?hubspot_error=token_exchange_failed`)
    }

    const tokenData = await tokenResponse.json()

    // In a real app, you'd store this token securely (database, session, etc.)
    // For demo purposes, we'll redirect with a success message
    const response = NextResponse.redirect(`${process.env.NEXTAUTH_URL || 'http://localhost:3002'}?hubspot_success=true`)

    // Store the access token in a cookie (not recommended for production)
    response.cookies.set('hubspot_access_token', tokenData.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: tokenData.expires_in,
      path: '/'
    })

    return response

  } catch (error) {
    console.error('HubSpot OAuth callback error:', error)
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL || 'http://localhost:3002'}?hubspot_error=callback_failed`)
  }
}