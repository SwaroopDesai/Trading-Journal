"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase"

export default function Login() {
  const supabase = createClient()
  const [email, setEmail] = useState("")

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
    })

    if (error) {
      alert("Error: " + error.message)
    } else {
      alert("Check your email!")
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Login</h1>

      <input
        type="email"
        placeholder="Enter email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <button onClick={handleLogin}>Send Magic Link</button>
    </div>
  )
}