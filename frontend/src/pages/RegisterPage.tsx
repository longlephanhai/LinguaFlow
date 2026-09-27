import { Link } from 'react-router-dom';
import {
  TextInput,
  PasswordInput,
  Button,
  Title,
  Text,
  Anchor,
  Box,
  Flex,
} from '@mantine/core';

export const RegisterPage = () => {
  return (
    <Flex mih="100vh" bg="var(--color-bg-base)">
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
              Create an account
            </Title>
            <Text c="var(--color-text-secondary)" fz="var(--text-base)">
              Start your language journey with us today.
            </Text>
          </Box>

          <Box 
            component="form" 
            onSubmit={(e: React.FormEvent) => e.preventDefault()} 
            display="flex" 
            style={{ flexDirection: 'column', gap: 'var(--space-6)' }}
          >
            <TextInput
              label="Full Name"
              placeholder="Jane Doe"
              required
              id="name"
              autoComplete="name"
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

            <TextInput
              label="Email"
              placeholder="hello@example.com"
              required
              id="email"
              autoComplete="email"
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
            
            <PasswordInput
              label="Password"
              placeholder="••••••••"
              required
              id="password"
              autoComplete="new-password"
              styles={{
                label: { fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: 'var(--space-2)' },
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

            <Button 
              type="submit" 
              fullWidth 
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
              Create Account
            </Button>
          </Box>

          <Text ta="center" mt="var(--space-8)" fz="var(--text-sm)" c="var(--color-text-secondary)">
            Already have an account?{' '}
            <Anchor component={Link} to="/login" fw={600} style={{ color: 'var(--color-accent-primary)' }}>
              Log in
            </Anchor>
          </Text>
        </Box>
      </Flex>

      {/* Visual Side */}
      <Flex 
        flex={1} 
        display={{ base: 'none', md: 'flex' }}
        align="center"
        justify="center"
        pos="relative"
        style={{
          borderLeft: '1px solid var(--color-border)',
          overflow: 'hidden',
          background: 'radial-gradient(circle at 85% 15%, rgba(219, 39, 119, 0.04) 0%, transparent 50%), radial-gradient(circle at 15% 85%, rgba(67, 56, 202, 0.04) 0%, transparent 50%), var(--color-surface)',
        }}
      >
        <Box
          component={Link}
          to="/"
          pos="absolute"
          top="var(--space-8)"
          right="var(--space-8)"
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
                “To have another language is to possess a second soul.”
              </Text>
              <Text
                mt="var(--space-4)"
                ff="var(--font-family-body)"
                fz="var(--text-sm)"
                fw={500}
                c="var(--color-text-secondary)"
              >
                Charlemagne
              </Text>
            </Box>
          </Box>
        </Box>
      </Flex>
    </Flex>
  );
};
