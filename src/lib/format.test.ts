import { formatNumber, formatPercentage, formatDuration } from './format'

describe('formatNumber', () => {
  it('adds commas for thousands', () => {
    expect(formatNumber(1000)).toBe('1,000')
  })

  it('adds commas for millions', () => {
    expect(formatNumber(1000000)).toBe('1,000,000')
  })

  it('does not add commas for small numbers', () => {
    expect(formatNumber(999)).toBe('999')
  })

  it('handles zero', () => {
    expect(formatNumber(0)).toBe('0')
  })

  it('handles negative numbers', () => {
    expect(formatNumber(-1500)).toBe('-1,500')
  })
})

describe('formatPercentage', () => {
  it('formats a decimal fraction as a percentage', () => {
    expect(formatPercentage(0.75)).toBe('75.0%')
  })

  it('formats zero correctly', () => {
    expect(formatPercentage(0)).toBe('0.0%')
  })

  it('passes through exactly 1 without multiplying (n is not < 1)', () => {
    // The function only multiplies by 100 when n < 1 && n >= 0
    // So 1 is treated as an already-percentage value
    expect(formatPercentage(1)).toBe('1.0%')
  })

  it('formats 0.999 as close to 100%', () => {
    expect(formatPercentage(0.999)).toBe('99.9%')
  })

  it('respects custom decimal places', () => {
    expect(formatPercentage(0.756, 2)).toBe('75.60%')
  })

  it('passes through values >= 1 as-is (treats them as already percentages)', () => {
    // Values >= 1 are not multiplied by 100
    expect(formatPercentage(75)).toBe('75.0%')
  })

  it('formats 0.5 correctly', () => {
    expect(formatPercentage(0.5)).toBe('50.0%')
  })
})

describe('formatDuration', () => {
  it('formats milliseconds for values under 1000ms', () => {
    expect(formatDuration(500)).toBe('500ms')
  })

  it('formats seconds for values at or above 1000ms', () => {
    expect(formatDuration(1000)).toBe('1.0s')
  })

  it('formats seconds with one decimal place', () => {
    expect(formatDuration(2500)).toBe('2.5s')
  })

  it('rounds milliseconds to nearest integer', () => {
    expect(formatDuration(99.7)).toBe('100ms')
  })

  it('handles zero', () => {
    expect(formatDuration(0)).toBe('0ms')
  })

  it('formats large durations', () => {
    expect(formatDuration(60000)).toBe('60.0s')
  })
})
