import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  if (error) {
    // Redirect to frontend with error
    return NextResponse.redirect(`${req.nextUrl.origin}/reimbursement?error=${encodeURIComponent(error)}`);
  }

  if (!code || !state) {
    return NextResponse.redirect(`${req.nextUrl.origin}/reimbursement?error=missing_parameters`);
  }

  // Create a simple HTML page that posts the code back to our API
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Completing Google Calendar Authorization...</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          margin: 0;
          background-color: #f5f5f5;
        }
        .container {
          text-align: center;
          background: white;
          padding: 2rem;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .spinner {
          border: 4px solid #f3f3f3;
          border-top: 4px solid #3498db;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
          margin: 0 auto 1rem;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="spinner"></div>
        <h2>Completing Authorization...</h2>
        <p>Please wait while we complete your Google Calendar connection.</p>
      </div>

      <script>
        // Post the authorization code to our API endpoint
        fetch('/api/auth/google', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code: '${code}',
            state: '${state}'
          })
        })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            // Store the access token and redirect back to reimbursement page
            sessionStorage.setItem('googleAccessToken', data.accessToken);
            window.location.href = '/reimbursement?google_auth=success';
          } else {
            window.location.href = '/reimbursement?error=' + encodeURIComponent(data.error || 'Authentication failed');
          }
        })
        .catch(error => {
          console.error('Auth error:', error);
          window.location.href = '/reimbursement?error=auth_failed';
        });
      </script>
    </body>
    </html>
  `;

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
    },
  });
}