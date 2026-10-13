// app/[lang]/layout.tsx
export function generateStaticParams() {
  return [{ lang: 'id' }, { lang: 'en' }, { lang: 'th' }]
}

export default async function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ lang: 'id' | 'en' | 'th' }>
}) {
  const { lang } = await params
  return <div data-lang={lang}>{children}</div>
}