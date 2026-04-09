import { SignIn } from '@clerk/clerk-react';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#F7F4EE] flex items-center justify-center px-4" dir="rtl">
      <div className="w-full max-w-md">

        {/* Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-4">
            <img src="/logo.png" alt="לוגו" className="h-10 w-10 object-cover rounded-full" />
          </div>
          <h1 className="text-2xl font-bold text-primary">כניסה לממשק ניהול</h1>
          <p className="text-sm text-muted-foreground mt-1">אתר הרב קלמן מאיר בר שליט&quot;א</p>
        </div>

        <SignIn
          forceRedirectUrl="/admin"
          appearance={{
            elements: {
              rootBox: 'w-full',
              card: 'shadow-xl rounded-lg border-t-4 border-t-[#C5A55A] w-full',
              headerTitle: 'text-[#1B2A4A] font-bold',
              headerSubtitle: 'text-muted-foreground',
              formButtonPrimary: 'bg-[#1B2A4A] hover:bg-[#1B2A4A]/90 text-white',
              formFieldInput: 'border border-input focus:border-[#C5A55A]',
              footerActionLink: 'text-[#C5A55A] hover:text-[#C5A55A]/80',
            },
          }}
        />

        <p className="text-center text-xs text-muted-foreground mt-6">
          גישה מורשית בלבד
        </p>
      </div>
    </div>
  );
}
