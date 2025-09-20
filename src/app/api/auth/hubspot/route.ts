import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')

  if (action === 'login') {
    // Redirect to HubSpot OAuth
    const clientId = process.env.HUBSPOT_CLIENT_ID
    const redirectUri = `${process.env.NEXTAUTH_URL || 'http://localhost:3002'}/api/auth/hubspot/callback`

    if (!clientId) {
      return NextResponse.json({ error: 'HubSpot Client ID not configured' }, { status: 500 })
    }

    const hubspotAuthUrl = `https://app.hubspot.com/oauth/authorize?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=crm.objects.contacts.read`

    return NextResponse.redirect(hubspotAuthUrl)
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}