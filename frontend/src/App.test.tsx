import { render } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import App from './App';

describe('App', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <MantineProvider>
        <App />
      </MantineProvider>
    );
    expect(container).toBeInTheDocument();
  });
});

