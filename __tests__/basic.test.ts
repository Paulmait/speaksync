// Simple test to verify Jest is working
describe('Basic Jest Setup', () => {
  it('should run basic JavaScript tests', () => {
    expect(1 + 1).toBe(2);
  });

  it('should handle async operations', async () => {
    const result = await Promise.resolve('test');
    expect(result).toBe('test');
  });

  it('should work with basic TypeScript', () => {
    const greet = (name: string): string => `Hello, ${name}!`;
    expect(greet('World')).toBe('Hello, World!');
  });
});
