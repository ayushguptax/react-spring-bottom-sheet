function inIframe() {
  try {
    return window.self !== window.top
  } catch {
    return true
  }
}

export function useDetectEnv() {
  return inIframe() ? 'iframe' : 'window'
}
