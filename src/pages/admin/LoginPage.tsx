import { SignIn } from '@clerk/clerk-react';

export default function LoginPage() {
  return (
    <div
      className="min-h-screen bg-[#F7F4EE] flex flex-col items-center justify-center px-4 py-10"
      dir="rtl"
    >
      {/* Title — same width as Clerk card */}
      <div className="text-center mb-6 w-full max-w-md px-2">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-4">
          <img src="/logo.png" alt="לוגו" className="h-10 w-10 object-cover rounded-full" />
        </div>
        <h1 className="text-2xl font-bold text-primary">כניסה לממשק ניהול</h1>
        <p className="text-sm text-muted-foreground mt-1">אתר הרב קלמן מאיר בר שליט&quot;א</p>
      </div>

      {/* Clerk form */}
      <SignIn
        forceRedirectUrl="/admin"
        appearance={{
          elements: {
            rootBox:           '!w-full !max-w-md',
            cardBox:           '!w-full !max-w-none !shadow-xl !rounded-lg border-t-4 border-t-[#C5A55A]',
            card:              '!w-full !max-w-none !shadow-none !rounded-none',
            headerTitle:       'text-[#1B2A4A] font-bold text-lg',
            headerSubtitle:    'hidden',
            formButtonPrimary: 'bg-[#1B2A4A] hover:bg-[#1B2A4A]/90 !text-white !w-full min-h-[44px]',
            formFieldInput:    'border border-gray-300 focus:border-[#C5A55A] !w-full',
            main:              '!w-full',
            form:              '!w-full',
            footer:            'hidden',
          },
        }}
      />

      <p className="text-center text-xs text-muted-foreground mt-4 w-full max-w-md">
        גישה מורשית בלבד
      </p>
    </div>
  );
}
