import { Metadata } from "next"

import ResetPassword from "@modules/account/components/reset-password"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { getStoreName } from "@lib/util/env"

/**
 * The page the password reset email links to.
 *
 * The link is built by backend/src/subscribers/password-reset.ts and carries
 * `token` plus a display-only `email`. It has no region prefix, because
 * middleware.ts adds one and preserves the query string, so the shopper lands
 * in their own region rather than one the backend guessed.
 */
export const metadata: Metadata = {
  title: `Välj nytt lösenord | ${getStoreName()}`,
  description: "Välj ett nytt lösenord för ditt konto.",
  // A reset link is single use and personal. Nothing here should be indexed,
  // and robots.txt cannot express this since the path carries a query string.
  robots: { index: false, follow: false },
  /*
   * Stops the token leaving in a Referer header.
   *
   * The URL carries the reset token, and this page inherits the site footer,
   * which has outbound `target="_blank"` links. Following one would otherwise
   * hand the full URL, token included, to a third-party site. The token is
   * single use and expires in 15 minutes, so this is narrow, but it costs one
   * line.
   */
  referrer: "no-referrer",
}

type Props = {
  searchParams: Promise<{ token?: string; email?: string }>
}

export default async function ResetPasswordPage({ searchParams }: Props) {
  const { token, email } = await searchParams

  if (!token) {
    return (
      <div className="content-container w-full flex justify-center py-10 sm:py-16">
        <div className="max-w-sm w-full flex flex-col items-center">
          <h1 className="text-large-semi uppercase mb-6 text-center">
            Länken är inte komplett
          </h1>
          <p className="text-center text-base-regular text-ui-fg-base mb-8">
            En del av länken saknas. Det händer oftast när adressen kopierats
            för hand. Be om en ny länk och öppna den direkt från mejlet.
          </p>
          <LocalizedClientLink href="/account" className="underline">
            Tillbaka till inloggningen
          </LocalizedClientLink>
        </div>
      </div>
    )
  }

  return (
    <div className="content-container w-full flex justify-center py-10 sm:py-16">
      <ResetPassword token={token} email={email} />
    </div>
  )
}
