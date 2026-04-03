import '@testing-library/jest-dom';

jest.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({
    push: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

jest.mock('next/link', () => {
  return ({ children, href, ...rest }: any) => (
    <a href={typeof href === 'string' ? href : href?.pathname} {...rest}>
      {children}
    </a>
  );
});
