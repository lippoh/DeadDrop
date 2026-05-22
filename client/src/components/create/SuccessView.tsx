'use client';

interface SuccessViewProps {
  token: string;
  url: string;
}

export function SuccessView({ token, url }: SuccessViewProps) {
  return (
    <div className="max-w-2xl rounded-3xl border border-white/10 bg-void-900/80 p-10 shadow-xl shadow-cipher-blue/10">
      <h2 className="text-3xl font-semibold text-ghost-100 mb-4">Your Dead Drop is ready</h2>
      <p className="text-ghost-400 mb-6">
        Share the link below with your recipient. It will expire after the selected time.
      </p>
      <div className="rounded-2xl border border-white/10 bg-void-950 p-5 text-ghost-200">
        <p className="text-sm text-ghost-500 mb-2">Link</p>
        <a href={url} className="break-all text-cipher-blue hover:text-cipher-glow">
          {url}
        </a>
      </div>
      <div className="mt-6 rounded-2xl border border-white/10 bg-void-950 p-5 text-ghost-200">
        <p className="text-sm text-ghost-500 mb-2">Token</p>
        <code className="block break-all text-sm text-ghost-100">{token}</code>
      </div>
    </div>
  );
}
