import React from 'react';
import { AlertCircle } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    // Keep a runtime trace for debugging in browser console.
    // eslint-disable-next-line no-console
    console.error('Module runtime error:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-2xl flex items-center space-x-3">
          <AlertCircle size={24} />
          <div>
            <p className="font-semibold">Đã xảy ra lỗi hiển thị module.</p>
            <p className="text-sm">Vui lòng tải lại trang hoặc chuyển tab khác để tiếp tục.</p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
