import { Metadata } from "next"

import LoginTemplate from "@modules/account/templates/login-template"
import { getStoreName } from "@lib/util/env"

export const metadata: Metadata = {
  title: "Logga in",
  description: `Logga in på ditt ${getStoreName()}-konto.`,
}

export default function Login() {
  return <LoginTemplate />
}
