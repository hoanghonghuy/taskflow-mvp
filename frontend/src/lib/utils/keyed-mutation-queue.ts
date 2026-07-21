export function createKeyedMutationQueue() {
  const tails = new Map<string, Promise<void>>()

  return {
    run<T>(key: string, mutation: () => Promise<T>): Promise<T> {
      const previous = tails.get(key) ?? Promise.resolve()
      const result = previous.catch(() => undefined).then(mutation)
      const tail = result.then(
        () => undefined,
        () => undefined,
      )

      tails.set(key, tail)
      void tail.finally(() => {
        if (tails.get(key) === tail) {
          tails.delete(key)
        }
      })

      return result
    },
  }
}
