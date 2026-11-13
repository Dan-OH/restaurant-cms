import { useState } from 'react'
import { Alert, Box, Button, Center, Field, Heading, Input, Stack } from '@chakra-ui/react'
import { Navigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useAuth } from './useAuth.js'

export default function LoginPage() {
  const { session, loading } = useAuth()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Also handles the redirect after a successful login, once the session arrives.
  if (!loading && session) {
    return <Navigate to={location.state?.from ?? '/admin'} replace />
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setSubmitting(false)
    }
  }

  return (
    <Center minH="100vh" bg="bg.subtle" p="4">
      <Box as="form" onSubmit={handleSubmit} w="full" maxW="sm" bg="bg" p="8" borderWidth="1px" borderRadius="lg">
        <Stack gap="5">
          <Heading size="xl">Log in</Heading>
          {error && (
            <Alert.Root status="error">
              <Alert.Indicator />
              <Alert.Title>{error}</Alert.Title>
            </Alert.Root>
          )}
          <Field.Root required>
            <Field.Label>Email</Field.Label>
            <Input
              type="email"
              autoComplete="username"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field.Root>
          <Field.Root required>
            <Field.Label>Password</Field.Label>
            <Input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field.Root>
          <Button type="submit" loading={submitting}>
            Log in
          </Button>
        </Stack>
      </Box>
    </Center>
  )
}
