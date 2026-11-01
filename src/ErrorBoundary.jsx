import { Component } from 'react'

/** Last line of defence: a render error shows a recoverable message instead of a blank page. */
export default class ErrorBoundary extends Component {
  state = { error: null }
  static getDerivedStateFromError(error) {
    return { error }
  }
  componentDidCatch(error, info) {
    console.error('UI error', error, info?.componentStack)
  }
  render() {
    if (!this.state.error) return this.props.children
    return (
      <div role="alert" className="grid min-h-screen place-items-center bg-[#f6f7f9] p-6 text-center">
        <div className="max-w-[420px]">
          <h1 className="text-[22px] font-semibold text-[#1b1f24]">Something went wrong</h1>
          <p className="mt-2 text-[15px] text-[#5b6470]">The page hit an unexpected error. Your data is safe. Reload to continue.</p>
          <button className="mt-5 h-11 rounded-full bg-[#13a24d] px-6 text-[15px] font-semibold text-white" onClick={() => window.location.reload()}>Reload</button>
        </div>
      </div>
    )
  }
}
