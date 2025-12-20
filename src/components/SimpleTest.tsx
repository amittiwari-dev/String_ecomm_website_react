import { preventMockDataInProduction } from '@/utils/environment';

const SimpleTest = () => {
  // Prevent this component from being used in production
  preventMockDataInProduction();
  
  // This component is for development testing only
  if (import.meta.env.PROD) {
    return (
      <div className="p-8 bg-red-50 border border-red-200">
        <h1 className="text-2xl font-bold mb-4 text-red-800">Test Component</h1>
        <p className="text-red-600">This component is not available in production builds.</p>
      </div>
    );
  }

  return (
    <div className="p-8 bg-white">
      <h1 className="text-2xl font-bold mb-4">Simple Test Component</h1>
      <div className="space-y-2">
        <p>Development mode test component</p>
        <p>Component is rendering properly!</p>
        <p>All data is now fetched from APIs - no static data used.</p>
      </div>
    </div>
  );
};

export default SimpleTest;