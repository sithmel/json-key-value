export function stats(results) {
  const sortedResults = [...results].sort((a, b) => a - b)
  const length = sortedResults.length
  const sum = sortedResults.reduce((a, b) => a + b, 0)
  const mean = sum / length
  const median =
    length % 2 === 0
      ? (results[length / 2 - 1] + results[length / 2]) / 2
      : results[length / 2]

  return {
    mean,
    median,
  }
}

export default async function perform(title, func, options = {}) {
  const formatter = new Intl.NumberFormat()
  const { times = 100 } = options
  console.log(`\x1b[43m* ${title} \x1b[0m\n`)
  console.log(`The benchmarks will be executed ${times} times.`)
  const timings = []
  const memoryUsage = []
  console.profile()
  for (let i = 0; i < times; i++) {
    let t0 = performance.now()
    await func()
    timings.push(performance.now() - t0)
    memoryUsage.push(process.memoryUsage().heapUsed)
  }
  console.profileEnd()
  const timingStats = stats(timings)
  const memoryStats = stats(memoryUsage)
  console.log(`
\x1b[44mTimings\x1b[0m
=======
Mean:   \x1b[34m${formatter.format(timingStats.mean)} ms\x1b[0m
Median: \x1b[34m${formatter.format(timingStats.median)} ms\x1b[0m

\x1b[44mHeap\x1b[0m
====
Mean:   \x1b[34m${formatter.format(memoryStats.mean / 1024)} KB\x1b[0m
Median: \x1b[34m${formatter.format(memoryStats.median / 1024)} KB\x1b[0m
`)
}
