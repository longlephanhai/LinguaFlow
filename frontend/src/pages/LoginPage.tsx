import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import {
  TextInput,
  PasswordInput,
  Button,
  Title,
  Text,
  Anchor,
  Box,
  Flex,
  Group,
  Alert,
} from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Failed to login');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Flex mih="100vh" bg="var(--color-bg-base)">
      {/* Visual Side */}
      <Flex 
        flex={1} 
        display={{ base: 'none', md: 'flex' }}
        align="center"
        justify="center"
        pos="relative"
        style={{
          borderRight: '1px solid var(--color-border)',
          overflow: 'hidden',
          background: 'radial-gradient(circle at 15% 15%, rgba(67, 56, 202, 0.04) 0%, transparent 50%), radial-gradient(circle at 85% 85%, rgba(219, 39, 119, 0.04) 0%, transparent 50%), var(--color-surface)',
        }}
      >
        <Box
          component={Link}
          to="/"
          pos="absolute"
          top="var(--space-8)"
          left="var(--space-8)"
          ff="var(--font-family-display)"
          fw={700}
          fz="var(--text-2xl)"
          style={{
            textDecoration: 'none',
            background: 'var(--color-ai-gradient)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            zIndex: 1,
          }}
        >
          LinguaFlow
        </Box>

        <Box maw={460} p="var(--space-8)" pos="relative" style={{ zIndex: 1 }}>
          <Box style={{ display: 'flex', gap: 'var(--space-6)', alignItems: 'stretch' }}>
            <Box
              w={3}
              style={{
                background: 'var(--color-ai-gradient)',
                borderRadius: 'var(--radius-full)',
                flexShrink: 0,
              }}
            />
            <Box>
              <Text
                ff="var(--font-family-display)"
                fz="var(--text-2xl)"
                fw={500}
                lh={1.4}
                c="var(--color-text-primary)"
                style={{ letterSpacing: '-0.01em' }}
              >
                “Language is the road map of a culture. It tells you where its people come from and where they are going.”
              </Text>
              <Text
                mt="var(--space-4)"
                ff="var(--font-family-body)"
                fz="var(--text-sm)"
                fw={500}
                c="var(--color-text-secondary)"
              >
                Rita Mae Brown
              </Text>
            </Box>
          </Box>
        </Box>
      </Flex>

      {/* Form Side */}
      <Flex 
        flex={1} 
        align="center" 
        justify="center" 
        p="var(--space-8)"
      >
        <Box w="100%" maw={400}>
          {/* Mobile Logo */}
          <Box
            component={Link}
            to="/"
            display={{ base: 'inline-block', md: 'none' }}
            mb="var(--space-8)"
            ff="var(--font-family-display)"
            fw={700}
            fz="var(--text-2xl)"
            style={{
              textDecoration: 'none',
              background: 'var(--color-ai-gradient)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            LinguaFlow
          </Box>

          <Box mb="var(--space-8)">
            <Title 
              order={1} 
              ff="var(--font-family-display)" 
              fz="var(--text-3xl)" 
              mb="var(--space-2)" 
              style={{ letterSpacing: '-0.02em', color: 'var(--color-text-primary)' }}
            >
              Welcome back
            </Title>
            <Text c="var(--color-text-secondary)" fz="var(--text-base)">
              Enter your details to access your vocabulary.
            </Text>
          </Box>

          <Box 
            component="form" 
            onSubmit={handleSubmit} 
            display="flex" 
            style={{ flexDirection: 'column', gap: 'var(--space-6)' }}
          >
            {error && (
              <Alert icon={<IconAlertCircle size="1rem" />} color="red" radius="md">
                {error}
              </Alert>
            )}

            <TextInput
              label="Email"
              placeholder="hello@example.com"
              required
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.currentTarget.value)}
              styles={{
                label: { fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: 'var(--space-2)' },
                input: {
                  padding: 'var(--space-3) var(--space-4)',
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  fontFamily: 'var(--font-family-body)',
                  fontSize: 'var(--text-base)',
                  color: 'var(--color-text-primary)',
                  height: 'auto',
                }
              }}
            />
            
            <Box style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <Group justify="space-between" align="baseline">
                <Text component="label" htmlFor="password" fz="var(--text-sm)" fw={500} c="var(--color-text-primary)">
                  Password <Text component="span" c="red">*</Text>
                </Text>
                <Anchor href="#" fz="var(--text-xs)" fw={500} style={{ color: 'var(--color-accent-primary)' }}>
                  Forgot password?
                </Anchor>
              </Group>
              <PasswordInput
                placeholder="••••••••"
                required
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.currentTarget.value)}
                styles={{
                  input: {
                    backgroundColor: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    fontFamily: 'var(--font-family-body)',
                    fontSize: 'var(--text-base)',
                    color: 'var(--color-text-primary)',
                    height: 'auto',
                  },
                  innerInput: {
                    padding: 'var(--space-3) var(--space-4)',
                    height: 'auto',
                  }
                }}
              />
            </Box>

            <Button 
              type="submit" 
              fullWidth 
              loading={isSubmitting}
              mt="var(--space-2)"
              radius="md"
              style={{
                padding: 'var(--space-3) var(--space-4)',
                fontSize: 'var(--text-base)',
                fontWeight: 600,
                height: 'auto',
                backgroundColor: 'var(--color-accent-primary)',
                color: 'white'
              }}
            >
              Log In
            </Button>
          </Box>

          <Text ta="center" mt="var(--space-8)" fz="var(--text-sm)" c="var(--color-text-secondary)">
            Don't have an account?{' '}
            <Anchor component={Link} to="/signup" fw={600} style={{ color: 'var(--color-accent-primary)' }}>
              Sign up
            </Anchor>
          </Text>
        </Box>
      </Flex>
    </Flex>
  );
};
