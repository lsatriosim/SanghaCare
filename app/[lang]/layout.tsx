// app/[lang]/layout.tsx
export function generateStaticParams() {
  return [{ lang: 'id' }, { lang: 'en' }, { lang: 'th' }]
}

type SupportedLang = 'id' | 'en' | 'th'

export default async function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ lang: string }>
}) {
  const { lang: rawLang } = await params

  // Fallback or narrow the type safely so `lang` is typed as 'id' | 'en' | 'th'
  const lang: SupportedLang = ['id', 'en', 'th'].includes(rawLang)
    ? (rawLang as SupportedLang)
    : 'id'

  return <div data-lang={lang}>{children}</div>
}