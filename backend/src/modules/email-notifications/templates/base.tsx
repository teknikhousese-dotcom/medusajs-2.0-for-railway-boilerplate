import { Html, Body, Container, Preview, Tailwind, Head, Section, Text, Link } from '@react-email/components'
import * as React from 'react'

interface BaseProps {
  preview?: string
  children: React.ReactNode
}

// Teknikhouse-branded e-post-skal (svenska). Header med ordmärke + footer med
// kontakt/trygghet. Alla mallar (order, retur, lösenord m.m.) ärver detta.
export const Base: React.FC<BaseProps> = ({ preview, children }) => {
  return (
    <Html lang="sv">
      <Head />
      <Preview>{preview}</Preview>
      <Tailwind>
        <Body className="bg-[#F4F5F7] my-auto mx-auto font-sans px-2">
          <Container className="bg-white rounded-[14px] my-[32px] mx-auto max-w-[480px] w-full overflow-hidden border border-solid border-[#ECECEF]">
            <Section className="bg-[#14161C] px-[28px] py-[18px]">
              <Text className="m-0 text-[19px] font-bold tracking-tight text-white">
                teknik<span style={{ color: '#F50000' }}>house</span>.se
              </Text>
            </Section>

            <div className="px-[28px] py-[26px] max-w-full break-words">
              {children}
            </div>

            <Section className="bg-[#FAFAFB] border-t border-solid border-[#ECECEF] px-[28px] py-[18px]">
              <Text className="m-0 text-[12px] leading-[1.6] text-[#8A8F9A]">
                Nordic Teknik House AB · Sveavägen 139, 113 46 Stockholm<br />
                Frågor? <Link href="mailto:info@teknikhouse.se" className="text-[#F50000] no-underline">info@teknikhouse.se</Link> · <Link href="https://teknikhouse.se" className="text-[#F50000] no-underline">teknikhouse.se</Link>
              </Text>
              <Text className="m-0 mt-[8px] text-[11px] text-[#B4B8C0]">
                Fri frakt över 999 kr · Öppet köp 30 dagar · Garanti ingår alltid
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}
